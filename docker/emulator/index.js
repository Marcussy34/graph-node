const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

require('dotenv').config();

const app = express();
const PORT = 8545;
const NODE_URL = process.env.UPSTREAM_RPC || '<YOUR_FALLBACK_UPSTREAM_RPC>';

app.use(bodyParser.json());

async function getBlockReceipts(block) {
  try {
    const { data: blockData } = await axios.post(NODE_URL, {
      jsonrpc: '2.0',
      method: 'eth_getBlockByNumber',
      params: [block, false],
      id: 1,
    });

    const transactions = blockData.result?.transactions || [];

    const receiptPromises = transactions.map((tx) =>
      axios.post(NODE_URL, {
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [tx],
        id: 1,
      })
    );

    const receiptsRaw = await Promise.all(receiptPromises);

    const receipts = receiptsRaw.map(({ data }) => {
      const txReceipt = data.result;

      // Normalize logs
      for (let log of txReceipt.logs) {
        let logData = {
          address: log.address,
          topics: log.topics,
          data: log.data,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          transactionIndex: log.transactionIndex,
          blockHash: log.blockHash,
          logIndex: log.logIndex,
          removed: log.removed,
          id: log.id,
        };
        txReceipt.logs = logData;
      }

      return txReceipt;
    });

    if (receipts.length === 0) {
      console.warn(`No receipts found for block ${block}`);
    }
    return receipts;
  } catch (err) {
    console.error('Error emulating eth_getBlockReceipts:', err.message);
    return null;
  }
}

// Add contract-specific query handler
async function queryContract(contractAddress, methodData, blockNumber = 'latest') {
  try {
    const { data } = await axios.post(NODE_URL, {
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [
        {
          to: contractAddress,
          data: methodData,
        },
        blockNumber,
      ],
      id: 1,
    });

    if (data.error) {
      throw new Error(`RPC Error: ${data.error.message}`);
    }

    return data.result;
  } catch (err) {
    console.error(`Error querying contract ${contractAddress}:`, err.message);
    throw err;
  }
}

// Add contract logs query handler
async function getContractLogs(contractAddress, topics, fromBlock, toBlock) {
  try {
    const { data } = await axios.post(NODE_URL, {
      jsonrpc: '2.0',
      method: 'eth_getLogs',
      params: [
        {
          fromBlock: fromBlock || '0x1',
          toBlock: toBlock || 'latest',
          address: contractAddress,
          topics: topics || [],
        },
      ],
      id: 1,
    });

    if (data.error) {
      throw new Error(`RPC Error: ${data.error.message}`);
    }

    return data.result;
  } catch (err) {
    console.error(`Error getting logs for contract ${contractAddress}:`, err.message);
    throw err;
  }
}

// JSON-RPC handler
app.post('/', async (req, res) => {
  const { method, params, id } = req.body;

  // Log incoming requests for debugging
  console.log(`Received ${method} request with params:`, params);

  if (method === 'eth_getBlockReceipts') {
    const [blockHashOrNumber] = params;
    try {
      const receipts = await getBlockReceipts(blockHashOrNumber);
      return res.json({ jsonrpc: '2.0', result: receipts, id });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        jsonrpc: '2.0',
        id,
        error: { code: -32000, message: 'Failed to emulate block receipts' },
      });
    }
  }

  // Custom method for contract queries
  if (method === 'custom_queryContract') {
    const [contractAddress, methodData, blockNumber] = params;
    try {
      const result = await queryContract(contractAddress, methodData, blockNumber);
      return res.json({ jsonrpc: '2.0', result, id });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        jsonrpc: '2.0',
        id,
        error: { code: -32000, message: 'Failed to query contract' },
      });
    }
  }

  // Custom method for contract logs
  if (method === 'custom_getContractLogs') {
    const [contractAddress, topics, fromBlock, toBlock] = params;
    try {
      const result = await getContractLogs(contractAddress, topics, fromBlock, toBlock);
      return res.json({ jsonrpc: '2.0', result, id });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        jsonrpc: '2.0',
        id,
        error: { code: -32000, message: 'Failed to get contract logs' },
      });
    }
  }

  // Fallback: proxy other calls to the real RPC
  try {
    const response = await axios.post(NODE_URL, req.body);
    res.json(response.data);
  } catch (err) {
    console.error('Upstream RPC error:', err.message);
    res.status(502).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Upstream RPC failed' },
      id,
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Emulator listening on http://localhost:${PORT}`);
});

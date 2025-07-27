# My Oasis Subgraph

A GraphQL API for indexing ERC-20 token transactions on the Oasis Sapphire network using The Graph Protocol.

## Overview

This subgraph indexes Transfer and Approval events from an ERC-20 token contract deployed on Oasis Sapphire, providing a GraphQL API to query token transaction data, user balances, and approval history.

### What it tracks:
- **Transfer Events**: Token transfers between addresses with amounts and metadata
- **Approval Events**: Token allowance approvals between owners and spenders  
- **User Analytics**: Aggregated statistics per address including total sent/received amounts and transaction counts

## Contract Details

- **Network**: Oasis Sapphire
- **Contract Address**: `0xcFF6932F0fED0f562E96f9d9B125d706e400f087`
- **Start Block**: 12656971
- **Contract Type**: ERC-20 Token

## Data Schema

### Entities

#### Transfer
- `id`: Unique identifier (transaction hash + log index)
- `from`: Sender address (User entity)
- `to`: Receiver address (User entity)
- `value`: Transfer amount
- `timestamp`: Block timestamp
- `blockNumber`: Block number
- `transactionHash`: Transaction hash

#### Approval
- `id`: Unique identifier (transaction hash + log index)
- `owner`: Token owner address (User entity)
- `spender`: Approved spender address (User entity)
- `value`: Approved amount
- `timestamp`: Block timestamp
- `blockNumber`: Block number
- `transactionHash`: Transaction hash

#### User
- `id`: Ethereum address
- `transfersFrom`: All transfers sent by this user
- `transfersTo`: All transfers received by this user
- `totalSent`: Total amount sent
- `totalReceived`: Total amount received
- `transactionCount`: Total number of transactions

## Quick Start

### Prerequisites
- Node.js 16+
- Graph CLI: `npm install -g @graphprotocol/graph-cli`
- Running Graph Node (see parent directory's docker-compose setup)

### Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Generate types**:
   ```bash
   npm run codegen
   ```

3. **Build the subgraph**:
   ```bash
   npm run build
   ```

4. **Deploy locally**:
   ```bash
   # Create the subgraph (first time only)
   npm run create-local
   
   # Deploy the subgraph
   npm run deploy
   ```

## Example Queries

### Get all transfers for a user
```graphql
{
  user(id: "0x...") {
    id
    totalSent
    totalReceived
    transactionCount
    transfersFrom(first: 10) {
      id
      to { id }
      value
      timestamp
    }
    transfersTo(first: 10) {
      id
      from { id }
      value
      timestamp
    }
  }
}
```

### Get recent transfers
```graphql
{
  transfers(first: 10, orderBy: timestamp, orderDirection: desc) {
    id
    from { id }
    to { id }
    value
    timestamp
    transactionHash
  }
}
```

### Get approval events
```graphql
{
  approvals(first: 10, orderBy: timestamp, orderDirection: desc) {
    id
    owner { id }
    spender { id }
    value
    timestamp
  }
}
```

### Get top users by transaction volume
```graphql
{
  users(first: 10, orderBy: totalSent, orderDirection: desc) {
    id
    totalSent
    totalReceived
    transactionCount
  }
}
```

## Development

### Scripts
- `npm run codegen`: Generate AssemblyScript types from schema and ABI
- `npm run build`: Build the subgraph WASM module
- `npm run deploy`: Deploy to local Graph Node
- `npm run create-local`: Create subgraph in local Graph Node (one-time setup)

### Configuration Files
- `subgraph.yaml`: Subgraph manifest defining data sources and mappings
- `schema.graphql`: GraphQL schema defining entities and relationships
- `src/mapping.ts`: AssemblyScript event handlers for processing blockchain events
- `abis/MyOasisContract.json`: Contract ABI for type generation

## Architecture

This subgraph follows The Graph Protocol's standard architecture:

1. **Event Detection**: Monitors the Oasis blockchain for Transfer/Approval events
2. **Data Processing**: Mapping functions process events and update entities
3. **Data Storage**: Processed data stored in Graph Node's PostgreSQL database
4. **GraphQL API**: Auto-generated API serves indexed data

## Use Cases

- **DeFi Analytics**: Track token flows and user behavior
- **Wallet Integration**: Query user's transaction history and balances
- **Tax Reporting**: Export comprehensive transaction data
- **Market Analysis**: Analyze token distribution and transfer patterns
- **Compliance**: Monitor large transfers and approval events

## License

MIT

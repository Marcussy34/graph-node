import { BigInt, Address } from "@graphprotocol/graph-ts"
import {
  Transfer as TransferEvent,
  Approval as ApprovalEvent
} from "../generated/MyOasisContract/MyOasisContract"
import { Transfer, Approval, User } from "../generated/schema"

export function handleTransfer(event: TransferEvent): void {
  // Create or load sender user
  let fromUser = User.load(event.params.from.toHexString())
  if (fromUser == null) {
    fromUser = new User(event.params.from.toHexString())
    fromUser.totalSent = BigInt.fromI32(0)
    fromUser.totalReceived = BigInt.fromI32(0)
    fromUser.transactionCount = BigInt.fromI32(0)
  }
  fromUser.totalSent = fromUser.totalSent.plus(event.params.value)
  fromUser.transactionCount = fromUser.transactionCount.plus(BigInt.fromI32(1))
  fromUser.save()

  // Create or load receiver user
  let toUser = User.load(event.params.to.toHexString())
  if (toUser == null) {
    toUser = new User(event.params.to.toHexString())
    toUser.totalSent = BigInt.fromI32(0)
    toUser.totalReceived = BigInt.fromI32(0)
    toUser.transactionCount = BigInt.fromI32(0)
  }
  toUser.totalReceived = toUser.totalReceived.plus(event.params.value)
  toUser.transactionCount = toUser.transactionCount.plus(BigInt.fromI32(1))
  toUser.save()

  // Create Transfer entity
  let transfer = new Transfer(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  )
  transfer.from = fromUser.id
  transfer.to = toUser.id
  transfer.value = event.params.value
  transfer.timestamp = event.block.timestamp
  transfer.blockNumber = event.block.number
  transfer.transactionHash = event.transaction.hash

  transfer.save()
}

export function handleApproval(event: ApprovalEvent): void {
  // Create or load owner user
  let ownerUser = User.load(event.params.owner.toHexString())
  if (ownerUser == null) {
    ownerUser = new User(event.params.owner.toHexString())
    ownerUser.totalSent = BigInt.fromI32(0)
    ownerUser.totalReceived = BigInt.fromI32(0)
    ownerUser.transactionCount = BigInt.fromI32(0)
  }
  ownerUser.save()

  // Create or load spender user
  let spenderUser = User.load(event.params.spender.toHexString())
  if (spenderUser == null) {
    spenderUser = new User(event.params.spender.toHexString())
    spenderUser.totalSent = BigInt.fromI32(0)
    spenderUser.totalReceived = BigInt.fromI32(0)
    spenderUser.transactionCount = BigInt.fromI32(0)
  }
  spenderUser.save()

  // Create Approval entity
  let approval = new Approval(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  )
  approval.owner = ownerUser.id
  approval.spender = spenderUser.id
  approval.value = event.params.value
  approval.timestamp = event.block.timestamp
  approval.blockNumber = event.block.number
  approval.transactionHash = event.transaction.hash

  approval.save()
} 
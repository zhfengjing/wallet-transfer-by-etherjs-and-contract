import {
  RedPacketPublished as RedPacketPublishedEvent,
  RedPacketGrabbed as RedPacketGrabbedEvent,
  RedPacketReclaimed as RedPacketReclaimedEvent,
} from "../../generated/RedPacket/RedPacket";
import {
  RedPacketPublished,
  RedPacketGrabbed,
  RedPacketReclaimed,
} from "../../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";

/**
 * 处理 RedPacket 合约中的 RedPacketPublished 事件
 * @param event - RedPacketPublished 事件对象
 */
export function handleRedPacketPublished(
  event: RedPacketPublishedEvent
): void {
  let entity = new RedPacketPublished(
    event.transaction.hash.concatI32(event.logIndex.toI32()).toHexString()
  );

  entity.owner = event.params.owner;
  entity.totalPackets = BigInt.fromI32(event.params.totalPackets);
  entity.totalAmount = event.params.totalAmount;
  entity.isEqual = event.params.isEqual;
  entity.timestamp = event.params.timestamp;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

/**
 * 处理 RedPacket 合约中的 RedPacketGrabbed 事件
 * @param event - RedPacketGrabbed 事件对象
 */
export function handleRedPacketGrabbed(event: RedPacketGrabbedEvent): void {
  let entity = new RedPacketGrabbed(
    event.transaction.hash.concatI32(event.logIndex.toI32()).toHexString()
  );

  entity.grabber = event.params.grabber;
  entity.amount = event.params.amount;
  entity.timestamp = event.params.timestamp;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

/**
 * 处理 RedPacket 合约中的 RedPacketReclaimed 事件
 * @param event - RedPacketReclaimed 事件对象
 */
export function handleRedPacketReclaimed(event: RedPacketReclaimedEvent): void {
  let entity = new RedPacketReclaimed(
    event.transaction.hash.concatI32(event.logIndex.toI32()).toHexString()
  );

  entity.owner = event.params.owner;
  entity.amount = event.params.amount;
  entity.timestamp = event.params.timestamp;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

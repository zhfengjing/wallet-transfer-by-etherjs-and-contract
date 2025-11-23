import { NewMessage as NewMessageEvent } from "../../generated/Message/Message";
import { NewMessage } from "../../generated/schema";

/**
 * 处理 Message 合约中的 NewMessage 事件
 * @param event - NewMessage 事件对象
 */
export function handleNewMessage(event: NewMessageEvent): void {
  let entity = new NewMessage(
    event.transaction.hash.concatI32(event.logIndex.toI32()).toHexString()
  );

  entity.sender = event.params.sender;
  entity.content = event.params.content;
  entity.timestamp = event.params.timestamp;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

import { Transfer as TransferEvent } from "../../generated/WalletTransfer/WalletTransfer";
import { Transfer } from "../../generated/schema";

/**
 * 处理 WalletTransfer 合约中的 Transfer 事件
 * @param event - Transfer 事件对象
 */
export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32()).toHexString()
  );

  entity.from = event.params.from;
  entity.to = event.params.to;
  entity.amount = event.params.amount;
  entity.timestamp = event.params.timestamp;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

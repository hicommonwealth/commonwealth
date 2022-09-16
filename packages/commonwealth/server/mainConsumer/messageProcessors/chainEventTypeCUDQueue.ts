import { DB } from '../../database';
import { Logger } from 'typescript-logging';
import {IRmqMsgCreateCETypeCUD, TRmqMsgCETypeCUD} from "common-common/src/rabbitmq/types/chainEventTypeCUD";

export type Ithis = {
  models: DB;
  log: Logger;
};

export async function processChainEventTypeCUD(
  this,
  data: TRmqMsgCETypeCUD
) {
  if (IRmqMsgCreateCETypeCUD(data)) {
    try {
      await this.models.ChainEventType.create({
        id: data.chainEventTypeId,
      });
    } catch (e) {
      this.log.error(
        `An error occurred while saving the ${data.chainEventTypeId} chain-event-type`,
        e
      );
      throw e;
    }
  } else {
    console.log("The received message type is not supported!", data);
    throw new Error(`The received message type is not supported! ${JSON.stringify(data)}`)
  }
}

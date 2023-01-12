import { RmqCETypeCUD } from 'common-common/src/rabbitmq/types/chainEventTypeCUD';
import type { Logger } from 'typescript-logging';
import type { DB } from '../../models';

export type Ithis = {
  models: DB;
  log: Logger;
};

export async function processChainEventTypeCUD(
  this: Ithis,
  data: RmqCETypeCUD.RmqMsgType
) {
  RmqCETypeCUD.checkMsgFormat(data);

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
}

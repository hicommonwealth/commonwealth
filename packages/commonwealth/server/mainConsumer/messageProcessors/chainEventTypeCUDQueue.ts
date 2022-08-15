import { DB } from '../../database';
import { Logger } from 'typescript-logging';

export type Ithis = {
  models: DB;
  log: Logger;
};

export async function processChainEventTypeCUD(
  this,
  chainEventTypeData: {
    chainEventTypeId: number;
    cud: 'create';
  }
) {
  try {
    await this.models.ChainEventType.create({
      id: chainEventTypeData.chainEventTypeId,
    });
  } catch (e) {
    this.log.error(
      `An error occurred while saving the ${chainEventTypeData.chainEventTypeId} chain-event-type`,
      e
    );
    throw e;
    // TODO: if we don't catch here the error is propogated up to the RabbitMQ
    //  Controller which will re-publish the message up to 3 times. A proper
    //  dead-letter queue strategy should also be set up with a consumer which
    //  sends alerts to devs
  }
}

import {
  CWEvent,
  IChainEventData,
  IChainEventKind,
  IEventHandler,
} from 'chain-events/src';
import {RabbitMQController} from 'common-common/src/rabbitmq/rabbitMQController';
import {addPrefix, factory} from '../../../src/logging';
import {ChainEventAttributes} from '../../database/models/chain_event';
import {IRmqMsgCreateCENotificationsCUD, RascalPublications} from 'common-common/src/rabbitmq/types';
import {DB} from "../../database/database";

export default class extends IEventHandler {
  public readonly name = 'Notification Producer';

  constructor(
    private readonly _models: DB,
    private readonly _rmqController?: RabbitMQController,
    private readonly _excludedEvents: IChainEventKind[] = []
  ) {
    super();
  }

  public async handle(event: CWEvent<IChainEventData>, dbEvent) {
    const log = factory.getLogger(
      addPrefix(__filename, [event.network, event.chain])
    );

    if (!dbEvent) {
      log.trace(`No db event received! Ignoring.`);
      return;
    }

    if (this._excludedEvents.includes(event.data.kind)) {
      log.trace(`Skipping event!`);
      return dbEvent;
    }

    let dbEventType;
    try {
      dbEventType = await dbEvent.getChainEventType();
      if (!dbEventType) {
        log.error(`Failed to fetch event type! Ignoring.`);
        return;
      }
    } catch (e) {
      log.error(
        `Failed to get chain-event type for event: ${JSON.stringify(event)}`
      );
      return dbEvent;
    }

    const formattedEvent: ChainEventAttributes = dbEvent.toJSON();
    formattedEvent.ChainEventType = dbEventType.toJSON();

    const publishData: IRmqMsgCreateCENotificationsCUD = {
      ChainEvent: formattedEvent, event, cud: 'create'
    }

    try {
      // attempt to publish - if the publish fails then don't update the db
      await this._rmqController.publish(
        publishData,
        RascalPublications.ChainEventNotificationsCUDMain
      );      // if publish succeeds attempt to update the database - if the update fails then log and move on
      // a background job will re-queue the message and update the db if successful
      await this._models.ChainEvent.update({
        queued: true
      }, {
        where: {id: dbEvent.id}
      }).catch((error) => {
        log.error(`Failed to ack queued message for chain_id: ${dbEvent.id}`, error);
      });
    } catch (e) {
      log.error(`Failed to queue ChainCUD msg: ${JSON.stringify(publishData)}`);
    }

    log.info("Chain-event Notification sent to CUD queue.");
    return dbEvent;
  }
}

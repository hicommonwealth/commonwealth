import type { RmqCENotificationCUD } from 'common-common/src/rabbitmq/types';
import {
  AbstractRabbitMQController,
  RascalPublications,
} from 'common-common/src/rabbitmq/types';

import { addPrefix, factory } from '../../../src/logging';
import type { ChainEventAttributes } from '../../database/models/chain_event';
import type { DB } from '../../database/database';

import type { CWEvent, IChainEventKind } from 'chain-events/src';
import { IEventHandler } from 'chain-events/src';

export default class extends IEventHandler {
  public readonly name = 'Notification Producer';

  constructor(
    private readonly _models: DB,
    private readonly _rmqController?: AbstractRabbitMQController,
    private readonly _excludedEvents: IChainEventKind[] = []
  ) {
    super();
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public async handle(event: CWEvent, dbEvent) {
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

    const publishData: RmqCENotificationCUD.RmqMsgType = {
      ChainEvent: formattedEvent,
      event,
      cud: 'create',
    };

    await this._rmqController.safePublish(
      publishData,
      dbEvent.id,
      RascalPublications.ChainEventNotificationsCUDMain,
      {
        sequelize: this._models.sequelize,
        model: this._models.ChainEvent,
      }
    );

    log.info('Chain-event Notification sent to CUD queue.');
    return dbEvent;
  }
}

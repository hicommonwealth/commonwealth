import type { RmqCENotificationCUD } from 'common-common/src/rabbitmq/types';
import {
  AbstractRabbitMQController,
  RascalPublications,
} from 'common-common/src/rabbitmq/types';

import { addPrefix, factory } from '../../../src/logging';
import type { ChainEventInstance } from '../../database/models/chain_event';
import type { DB } from '../../database/database';

import type { CWEvent, IChainEventKind } from 'chain-events/src';
import {
  EntityEventKind,
  eventToEntity,
  IEventHandler,
} from 'chain-events/src';

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
  public async handle(event: CWEvent, dbEvent: ChainEventInstance) {
    const log = factory.getLogger(
      addPrefix(__filename, [event.network, event.chain])
    );

    if (!dbEvent) {
      log.warn(`No db event received! Ignoring.`);
      return;
    }

    if (this._excludedEvents.includes(event.data.kind)) {
      log.warn(`Skipping event!`);
      return dbEvent;
    }

    if (!dbEvent.entity_id) {
      log.info(`No related entity, skipping!`);
      return dbEvent;
    }

    const [, eventEntityKind] = eventToEntity(event.network, event.data.kind);
    if (
      eventEntityKind != EntityEventKind.Create &&
      eventEntityKind != EntityEventKind.Complete
    ) {
      log.trace(
        `Event does not mark the creation or completion of an entity. Skipping event!`
      );
      return dbEvent;
    }

    const publishData: RmqCENotificationCUD.RmqMsgType = {
      ChainEvent: dbEvent.toJSON(),
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

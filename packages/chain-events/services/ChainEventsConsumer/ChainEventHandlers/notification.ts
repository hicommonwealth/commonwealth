import {
  CWEvent,
  EntityEventKind,
  eventToEntity,
  IChainEventData,
  IChainEventKind,
  IEventHandler,
} from 'chain-events/src';
import {RabbitMQController} from 'common-common/src/rabbitmq/rabbitMQController';
import {RascalPublications, RmqCENotificationCUD} from 'common-common/src/rabbitmq/types';

import {addPrefix, factory} from '../../../src/logging';
import {ChainEventInstance} from '../../database/models/chain_event';
import {DB} from '../../database/database';

export default class extends IEventHandler {
  public readonly name = 'Notification Producer';

  constructor(
    private readonly _models: DB,
    private readonly _rmqController?: RabbitMQController,
    private readonly _excludedEvents: IChainEventKind[] = []
  ) {
    super();
  }

  public async handle(event: CWEvent<IChainEventData>, dbEvent: ChainEventInstance) {
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

    const [, eventEntityKind] = eventToEntity(event.network, event.data.kind);
    if (eventEntityKind != EntityEventKind.Create && eventEntityKind != EntityEventKind.Complete) {
      log.trace(`Event does not mark the creation or completion of an entity. Skipping event!`);
      return dbEvent;
    }

    if (!dbEvent.entity_id) {
      log.trace(`No related entity, skipping!`);
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

import type {
  RabbitMQController,
  RmqCETypeCUD,
} from 'common-common/src/rabbitmq';
import {
  RascalPublications,
  RepublishFailedMessages,
} from 'common-common/src/rabbitmq';
import * as Sequelize from 'sequelize';

import type { DB } from '../database/database';

/**
 * A worker that periodically republishes data from the database if it's queued value is between -1 and 5. A queued
 * value of -1
 *
 */
export class RepublishMessages extends RepublishFailedMessages<DB> {
  constructor(_rmqController: RabbitMQController, _models: DB) {
    super(_rmqController, _models, 180000);
  }

  protected async job(): Promise<void> {
    const result = await this._models.ChainEventType.findAll({
      where: {
        queued: {
          [Sequelize.Op.between]: [-1, 5],
        },
      },
    });

    // TODO
    // if (result.length > 100) {}

    for (const eventType of result) {
      const publishData: RmqCETypeCUD.RmqMsgType = {
        chainEventTypeId: eventType.id,
        cud: 'create',
      };

      await this._rmqController.safePublish(
        publishData,
        eventType.id,
        RascalPublications.ChainEventTypeCUDMain,
        {
          sequelize: this._models.sequelize,
          model: this._models.ChainEventType,
        }
      );
    }
  }
}

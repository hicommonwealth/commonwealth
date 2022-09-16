import {DB} from "../database/database";
import {
  IRmqMsgCreateCETypeCUD,
  RabbitMQController,
  RascalPublications,
  RepublishFailedMessages
} from "common-common/src/rabbitmq";
import Sequelize from "sequelize";

export class RepublishMessages extends RepublishFailedMessages<DB> {
  constructor(
    _rmqController: RabbitMQController,
    _models: DB
  ) {
    super(_rmqController, _models, 180000);
  }

  protected async job() {
    const result = await this._models.ChainEventType.findAll({
      where: {
        queued: {
          [Sequelize.Op.between]: [0, 5]
        }
      }
    });

    // TODO
    if (result.length > 100) {}

    for (const eventType of result) {
      const publishData: IRmqMsgCreateCETypeCUD = {
        chainEventTypeId: eventType.id,
        cud: 'create'
      }

      await this._rmqController.safePublish(
        publishData,
        eventType.id,
        RascalPublications.ChainEventTypeCUDMain,
        {
          sequelize: this._models.sequelize,
          model: this._models.ChainEventType
        }
      )
    }
  }
}


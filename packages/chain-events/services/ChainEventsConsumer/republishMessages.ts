import {DB} from "../database/database";
import {RabbitMQController, RepublishFailedMessages} from "common-common/src/rabbitmq";

export class RepublishMessages extends RepublishFailedMessages<DB> {
  constructor(
    _rmqController: RabbitMQController,
    _models: DB
  ) {
    super(_rmqController, _models, 180000);
  }

  public async job() {
    const result = await this._models.ChainEventType.findAll()
  }
}

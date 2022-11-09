import Rascal from "rascal";
import { SnapshotEvent, EventHandler, ServerError } from "../types/";
import { RabbitMQController } from "common-common/src/rabbitmq/rabbitMQController";
import { RascalPublications } from "common-common/src/rabbitmq";

export class RabbitMqHandler extends RabbitMQController
  implements EventHandler {
  protected publication: RascalPublications;

  constructor(
    _rabbitMQConfig: Rascal.BrokerConfig,
    publication: RascalPublications
  ) {
    super(_rabbitMQConfig);
    if (!this.publishers.includes(publication))
      throw new ServerError("Given publication does not exist!");
    this.publication = publication;
  }

  public async handle(event: SnapshotEvent): Promise<any> {
    try {
      await this.publish(event, this.publication);
    } catch (err) {
      throw new ServerError(`Rascal config error: ${err.message}`);
    }
  }
}

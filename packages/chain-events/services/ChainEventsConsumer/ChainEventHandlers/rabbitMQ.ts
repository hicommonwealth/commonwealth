import { CWEvent, IEventHandler } from 'chain-events/src';
import Rascal from 'rascal';
import {RascalPublications, RabbitMQController} from 'common-common/src/rabbitmq'

export class RabbitMqHandler extends RabbitMQController implements IEventHandler {

  protected publication: RascalPublications

  constructor(_rabbitMQConfig: Rascal.BrokerConfig, publication: RascalPublications) {
    super(_rabbitMQConfig);
    if (!this.publishers.includes(publication)) throw new Error('Given publication does not exist!');
    this.publication = publication;
  }

  public async handle(event: CWEvent): Promise<any> {
    if (!event) {
      return;
    }

    try {
      await this.publish(event, this.publication);
    } catch (err) {
      throw new Error(`Rascal config error: ${err.message}`);
    }
  }
}

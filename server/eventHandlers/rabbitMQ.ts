import { CWEvent, IEventHandler } from '@commonwealth/chain-events';
import Rascal from 'rascal';
import { RabbitMQController } from '../util/rabbitmq/rabbitMQController';

export class RabbitMqHandler extends RabbitMQController implements IEventHandler {

  protected publication: string

  constructor(_rabbitMQConfig: Rascal.BrokerConfig, publication: string) {
    super(_rabbitMQConfig);
    if (!this.publishers.includes(publication)) throw new Error('Given publication does not exist!');
    this.publication = publication;
  }

  public async handle(event: CWEvent): Promise<any> {
    try {
      await this.publish(event, this.publication);
    } catch (err) {
      throw new Error(`Rascal config error: ${err.message}`);
    }
  }
}

import Rascal from 'rascal';
import { CWEvent, IEventHandler } from 'chain-events/src';
import { RascalPublications } from 'common-common/src/rabbitmq';
import { RabbitMQController } from 'common-common/src/rabbitmq/rabbitMQController';
import { ServerError } from '../util/errors';

export class RabbitMqHandler extends RabbitMQController
  implements IEventHandler {
  protected publication: RascalPublications;

  constructor(
    _rabbitMQConfig: Rascal.BrokerConfig,
    publication: RascalPublications
  ) {
    super(_rabbitMQConfig);
    if (!this.publishers.includes(publication))
      throw new ServerError('Given publication does not exist!');
    this.publication = publication;
  }

  public async handle(event: CWEvent): Promise<any> {
    try {
      await this.publish(event, this.publication);
    } catch (err) {
      throw new ServerError(`Rascal config error: ${err.message}`);
    }
  }
}

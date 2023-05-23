import type Rascal from 'rascal';
import type { RascalPublications } from 'common-common/src/rabbitmq/types';
import { AbstractRabbitMQController } from 'common-common/src/rabbitmq/types';
import {
  MockRabbitMQController,
  RabbitMQController,
} from 'common-common/src/rabbitmq';

import type { CWEvent, IEventHandler } from 'chain-events/src';

export abstract class IRabbitMqHandler
  extends AbstractRabbitMQController
  implements IEventHandler
{
  public abstract handle(event: CWEvent): Promise<any>;
}

export class RabbitMqHandler
  extends RabbitMQController
  implements IRabbitMqHandler
{
  protected publication: RascalPublications;

  constructor(
    _rabbitMQConfig: Rascal.BrokerConfig,
    publication: RascalPublications
  ) {
    super(_rabbitMQConfig);
    if (!this.publishers.includes(publication))
      throw new Error('Given publication does not exist!');
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

export class MockRabbitMqHandler
  extends MockRabbitMQController
  implements IRabbitMqHandler
{
  protected publication: RascalPublications;

  constructor(
    _rabbitMQConfig: Rascal.BrokerConfig,
    publication: RascalPublications
  ) {
    super(_rabbitMQConfig);
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

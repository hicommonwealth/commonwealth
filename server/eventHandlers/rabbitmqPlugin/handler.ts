import { CWEvent, IEventHandler } from '@commonwealth/chain-events';
import { RabbitMqProducer } from './producer';
import config from './RabbitMQconfig.json';

export class RabbitMqHandler extends RabbitMqProducer implements IEventHandler {
  constructor(_rabbitMQConfig: any) {
    // defaults to the RabbitMQconfig
    let tempConfig = _rabbitMQConfig;
    if (!tempConfig) tempConfig = config;
    super(tempConfig);
  }

  public async handle(event: CWEvent): Promise<any> {
    try {
      await this.publish(event, this.publishers[0]);
    } catch (err) {
      throw new Error(`Rascal config error: ${err.message}`);
    }
  }
}

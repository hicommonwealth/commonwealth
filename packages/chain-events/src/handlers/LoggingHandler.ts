import { CWEvent, IEventHandler, IChainEventData } from '../interfaces';
import { addPrefix, factory } from '../logging';

export class LoggingHandler extends IEventHandler {
  public async handle(event: CWEvent): Promise<IChainEventData> {
    const log = factory.getLogger(
      addPrefix(__filename, [event.network, event.chain])
    );
    log.info(`Received event: ${JSON.stringify(event, null, 2)}`);
    return null;
  }
}

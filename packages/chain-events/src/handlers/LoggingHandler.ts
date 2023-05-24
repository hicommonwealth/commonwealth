import type { CWEvent, IChainEventData } from '../interfaces';
import { IEventHandler } from '../interfaces';
import { addPrefix, factory } from '../logging';

export class LoggingHandler extends IEventHandler {
  public async handle(event: CWEvent): Promise<IChainEventData> {
    const prefixes = [event.network, event.chainName];
    if (event.contractAddress) prefixes.push(event.contractAddress);
    const log = factory.getLogger(addPrefix(__filename, prefixes));
    log.info(`Received event: ${JSON.stringify(event, null, 2)}`);
    return null;
  }
}

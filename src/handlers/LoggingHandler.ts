import { CWEvent, IEventHandler } from '../interfaces';
import { factory, formatFilename } from '../logging';

const log = factory.getLogger(formatFilename(__filename));

export class LoggingHandler extends IEventHandler {
  public async handle(event: CWEvent): Promise<any> {
    log.info(`Received event: ${JSON.stringify(event, null, 2)}`);
  }
}

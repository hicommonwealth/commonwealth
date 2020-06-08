/**
 * Determines which chain entities each event affects and updates state accordingly.
 */
import WebSocket from 'ws';
import { factory, formatFilename } from '../../../shared/logging';
import { CWEvent, IEventHandler } from '../../../shared/events/interfaces';
import { IMolochEventData } from '../../../shared/events/moloch/types';
const log = factory.getLogger(formatFilename(__filename));

export default class extends IEventHandler {
  constructor(
    private readonly _models,
    private readonly _chain: string,
    private readonly _wss?: WebSocket.Server,
  ) {
    super();
  }

  /**
   * Handles an existing ChainEvent by connecting it with an entity, and creating
   * threads as needed.
   *
   * `dbEvent` is the database entry corresponding to the `event`.
   */
  public async handle(event: CWEvent<IMolochEventData>, dbEvent) {
    if (!dbEvent) {
      log.error('no db event found!');
      return;
    }

    return null;
  }
}

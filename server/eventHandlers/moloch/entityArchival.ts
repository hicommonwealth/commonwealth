/**
 * Determines which chain entities each event affects and updates state accordingly.
 */
import WebSocket from 'ws';
import { factory, formatFilename } from '../../../shared/logging';
import { CWEvent, IEventHandler } from '../../../shared/events/interfaces';
import { IMolochEventData } from '../../../shared/events/moloch/types';
import { WebsocketMessageType, IWebsocketsPayload } from '../../../shared/types';
const log = factory.getLogger(formatFilename(__filename));

export default class extends IEventHandler {
  constructor(
    private readonly _models,
    private readonly _chain: string,
    private readonly _wss?: WebSocket.Server,
  ) {
    super();
  }

  // TODO: refactor this into a shared event handler util?
  public async wssSend(dbEntity, dbEvent) {
    if (!this._wss) return;
    const dbEventType = await dbEvent.getChainEventType();
    const payload: IWebsocketsPayload<any> = {
      event: WebsocketMessageType.ChainEntity,
      data: {
        object_id: dbEntity.id,
        chainEntity: dbEntity.toJSON(),
        chainEvent: dbEvent.toJSON(),
        chainEventType: dbEventType.toJSON(),
      }
    };
    try {
      this._wss.emit(WebsocketMessageType.ChainEntity, payload);
    } catch (e) {
      log.warn(`Failed to emit websocket event for entity ${dbEntity.type}:${dbEntity.type_id}`);
    }
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

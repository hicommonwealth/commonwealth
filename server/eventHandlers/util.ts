import WebSocket from 'ws';

import { IWebsocketsPayload, WebsocketMessageType } from '../../shared/types';

import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

export async function wssSendEntity(wss: WebSocket.Server, dbEntity, dbEvent) {
  if (!wss) return;
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
    wss.emit(WebsocketMessageType.ChainEntity, payload);
  } catch (e) {
    log.warn(`Failed to emit websocket event for entity ${dbEntity.type}:${dbEntity.type_id}`);
  }
}

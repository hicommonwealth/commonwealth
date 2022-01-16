import { Server } from 'socket.io';
import { addPrefix, factory } from '../../shared/logging';
import {
  WebsocketEngineEvents,
  WebsocketMessageType,
  WebsocketNamespaces,
} from '../../shared/types';
import { authenticate } from './index';

const log = factory.getLogger(addPrefix(__filename));

export function createCeNamespace(io: Server) {
  const CeNs = io.of('/chain-events');
  io.use(authenticate);

  CeNs.on('connection', (socket) => {
    log.info(`${socket.id} connected to Chain-Events`);

    socket.on('disconnect', () => {
      log.info(`${socket.id} disconnected from Chain-Events`);
    });

    socket.on('newSubscriptions', (chainEventTypes: string[]) => {
      log.info(`${socket.id} joining ${JSON.stringify(chainEventTypes)}`);
      if (chainEventTypes.length > 0) socket.join(chainEventTypes);
    });

    socket.on('deleteSubscriptions', (chainEventTypes: string[]) => {
      for (const eventType of chainEventTypes) socket.leave(eventType);
    });
  });

  io.of(`/${WebsocketNamespaces.ChainEvents}`).adapter.on(
    WebsocketEngineEvents.CreateRoom,
    (room) => {
      log.info(`New room created: ${room}`);
    }
  );

  io.of(`/${WebsocketNamespaces.ChainEvents}`).adapter.on(
    WebsocketEngineEvents.DeleteRoom,
    (room) => {
      log.info(`Room: ${room}, was deleted`);
    }
  );

  return CeNs;
}

/**
 * This function is passed into the RabbitMQController when handling incoming notification events. It emits the event
 * received from the queue to the appropriate room. The context (this) should be the chain-events namespace
 * @param notification A Notification model instance
 */
export function publishToCERoom(this: Server, notification: any) {
  this.to(notification.ChainEvent.ChainEventType.id).emit(
    WebsocketMessageType.ChainEventNotification,
    notification
  );
}

import { Server } from 'socket.io';
import { addPrefix, factory } from 'common-common/src/logging';
import {
  ChainEventNotification,
  WebsocketEngineEvents,
  WebsocketMessageNames,
  WebsocketNamespaces,
} from '../../shared/types';
import { authenticate } from './index';

const log = factory.getLogger(addPrefix(__filename));

export function createCeNamespace(io: Server) {
  const CeNs = io.of(`/${WebsocketNamespaces.ChainEvents}`);
  CeNs.use(authenticate);

  CeNs.on('connection', (socket) => {
    log.info(`socket_id = ${socket.id}, user_id = ${(<any>socket).user.id} connected to Chain-Events`);

    socket.on('disconnect', () => {
      log.info(`socket_id = ${socket.id}, user_id = ${(<any>socket).user.id} disconnected from Chain-Events`);
    });

    socket.on(
      WebsocketMessageNames.NewSubscriptions,
      (chainEventTypes: string[]) => {
          if (chainEventTypes.length > 0) {
              log.info(`socket_id = ${socket.id}, user_id = ${(<any>socket).user.id} joining ${JSON.stringify(chainEventTypes)}`);
              socket.join(chainEventTypes);
          }
      }
    );

    socket.on(
      WebsocketMessageNames.DeleteSubscriptions,
      (chainEventTypes: string[]) => {
        if (chainEventTypes.length > 0) {
            log.info(`socket_id = ${socket.id}, user_id = ${(<any>socket).user.id} leaving ${JSON.stringify(chainEventTypes)}`);
            for (const eventType of chainEventTypes) socket.leave(eventType);
        }
      }
    );
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
export function publishToCERoom(
  this: Server,
  notification: ChainEventNotification
) {
  this.to(notification.ChainEvent.ChainEventType.id).emit(
    WebsocketMessageNames.ChainEventNotification,
    notification
  );
}

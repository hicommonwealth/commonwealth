import { addPrefix, factory } from 'common-common/src/logging';
import type { Server } from 'socket.io';
import type {
  ChainEventNotification,
  SnapshotProposalNotification,
  WebsocketNamespaces,
} from '../../shared/types';
import {
  WebsocketEngineEvents,
  WebsocketMessageNames,
} from '../../shared/types';
import { authenticate } from './index';

const log = factory.getLogger(addPrefix(__filename));

export function createNamespace(io: Server, namespace: WebsocketNamespaces) {
  const CeNs = io.of(`/${namespace}`);
  CeNs.use(authenticate);

  CeNs.on('connection', (socket) => {
    log.info(
      `socket_id = ${socket.id}, user_id = ${
        (<any>socket).user.id
      } connected to Chain-Events`
    );

    socket.on('disconnect', () => {
      log.info(
        `socket_id = ${socket.id}, user_id = ${
          (<any>socket).user.id
        } disconnected from Chain-Events`
      );
    });

    socket.on(
      WebsocketMessageNames.NewSubscriptions,
      (eventTypes: string[]) => {
        if (eventTypes.length > 0) {
          log.info(
            `socket_id = ${socket.id}, user_id = ${
              (<any>socket).user.id
            } joining ${JSON.stringify(eventTypes)}`
          );
          socket.join(eventTypes);
        }
      }
    );

    socket.on(
      WebsocketMessageNames.DeleteSubscriptions,
      (eventTypes: string[]) => {
        if (eventTypes.length > 0) {
          log.info(
            `socket_id = ${socket.id}, user_id = ${
              (<any>socket).user.id
            } leaving ${JSON.stringify(eventTypes)}`
          );
          for (const eventType of eventTypes) socket.leave(eventType);
        }
      }
    );
  });

  io.of(`/${namespace}`).adapter.on(
    WebsocketEngineEvents.CreateRoom,
    (room) => {
      log.info(`New room created: ${room}`);
    }
  );

  io.of(`/${namespace}`).adapter.on(
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
export async function publishToChainEventsRoom(
  this: { server: Server },
  notification: ChainEventNotification
) {
  this.server
    .to(notification.ChainEvent.ChainEventType.id)
    .emit(WebsocketMessageNames.ChainEventNotification, notification);
}

export async function publishToSnapshotRoom(
  this: { server: Server },
  notification: SnapshotProposalNotification
) {
  this.server
    .to(notification.SnapshotProposal.id)
    .emit(WebsocketMessageNames.SnapshotProposalNotification, notification);
}

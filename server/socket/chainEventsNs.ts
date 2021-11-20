import { Server } from 'socket.io';
import { CWEvent } from '@commonwealth/chain-events';
import { addPrefix, factory } from '../../shared/logging';
import { WebsocketEngineEvents, WebsocketMessageType, WebsocketNamespaces } from '../../shared/types';
import { Notification } from '../../client/scripts/models';

const log = factory.getLogger(addPrefix(__filename));

export function createCeNamespace(io: Server) {
	const CeNs = io.of('/chain-events');

	CeNs.on('connection', (socket) => {
		log.info(`${socket.id} connected to Chain-Events`)

		socket.on('disconnect', () => {
			log.info(`${socket.id} disconnected from Chain-Events`);
		});

		socket.on('updateSubscriptions', () => {
			const rooms = [];
			socket.join(rooms);
		})

		socket.on('newSubscriptions', (chainEventTypes: string[]) => {
			socket.join(chainEventTypes);
		})

		socket.on('deleteSubscriptions', (chainEventTypes: string[]) => {
			for (const eventType of chainEventTypes) socket.leave(eventType)
		})
	});

	io.of(`/${WebsocketNamespaces.ChainEvents}`).adapter.on(WebsocketEngineEvents.CreateRoom, (room) => {
		log.info(`New room created: ${room}`)
	})

	io.of(`/${WebsocketNamespaces.ChainEvents}`).adapter.on(WebsocketEngineEvents.DeleteRoom, (room) => {
		log.info(`Room: ${room}, was deleted`)
	})

	return CeNs
}

/**
 * This function is passed into the RabbitMQController when handling incoming notification events. It emits the event
 * received from the queue to the appropriate room. The context (this) should be the chain-events namespace
 * @param notification A Notification model instance
 */
export function publishToCERoom(this: Server, notification: Notification) {
	this.to(notification.subscription.ChainEventType).emit(WebsocketMessageType.ChainEventNotification, notification);
}

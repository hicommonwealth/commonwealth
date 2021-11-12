import { Server } from 'socket.io';
import { CWEvent } from '@commonwealth/chain-events';
import { addPrefix, factory } from '../../shared/logging';
import { WebsocketEngineEvents, WebsocketMessageType, WebsocketNamespaces } from '../../shared/types';

const log = factory.getLogger(addPrefix(__filename));

export function createCeNamespace(io: Server) {
	const CeNs = io.of('/chain-events');

	CeNs.on('connection', (socket) => {
		log.info('a user has connected')
		socket.on('disconnect', () => {
			log.info('user disconnected');
		});

		// TODO: query user chain-events subscriptions
		socket.join([])

		socket.on('newSubscription', (subscriptionName) => {
			socket.join(subscriptionName);
		})

		socket.on('deleteSubscription', (subscriptionName) => {
			socket.leave(subscriptionName)
		})
	});

	io.of(`/${WebsocketNamespaces.ChainEvents}`).adapter.on(WebsocketEngineEvents.CreateRoom, (room) => {
		log.info(`New room created for ${room}`)
	})

	io.of(`/${WebsocketNamespaces.ChainEvents}`).adapter.on(WebsocketEngineEvents.DeleteRoom, (room) => {
		log.info(`The ${room} was deleted`)
	})

	return CeNs
}

/**
 * This function is passed into the RabbitMQController when handling incoming notification events. It emits the event
 * received from the queue to the appropriate room. The context (this) should be the chain-events namespace
 * @param event
 */
export function publishToCERoom(this: Server, event: CWEvent) {
	this.to(`${event.chain}-${event.data.kind}`).emit(WebsocketMessageType.ChainEventNotification, event);
}

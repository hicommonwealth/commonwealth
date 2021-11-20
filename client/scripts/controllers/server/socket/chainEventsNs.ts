// import io from 'socket.io-client';

import { WebsocketMessageType, WebsocketNamespaces } from 'types';
import app from 'state';
import { Notification, NotificationSubscription } from 'models';
import { io } from 'socket.io-client';


export class ChainEventsNamespace {
	private ceNs;
	private _isConnected = false;

	constructor(domain: string) {
		this.ceNs = io(`${domain}/${WebsocketNamespaces.ChainEvents}`);
		this.ceNs.on('connect', this.onconnect.bind(this));
		this.ceNs.on('disconnect', this.ondisconnect.bind(this))
		this.ceNs.on(WebsocketMessageType.ChainEventNotification, this.onChainEvent.bind(this))
	}

	public addChainEventSubscriptions(subs: NotificationSubscription[]) {
		const eventTypes = subs.map(x => x.ChainEventType).filter(x => !!x);
		console.log('Adding Websocket subscriptions for:', eventTypes)
		this.ceNs.emit('newSubscriptions', eventTypes);
	}

	public deleteChainEventSubscriptions(subs: NotificationSubscription[]) {
		const eventTypes = subs.map(x => x.ChainEventType).filter(x => !!x);
		console.log('Deleting Websocket subscriptions for:', eventTypes)
		this.ceNs.emit('deleteSubscriptions', subs.map(x => x.ChainEventType));
	}

	private onChainEvent(notification: Notification) {
		console.log('Notification received:', notification)
		app.user.notifications.update(notification)
	}

	private onconnect() {
		this._isConnected = true;
		this.ceNs.emit('newSubscriptions', app.user.notifications.subscriptions)
		console.log('Chain events namespace connected!')
	}

	private ondisconnect(reason) {
		this._isConnected = false;
		console.log(reason)
		// TODO: notify user that live chain-events notifications are disabled?
	}

	public get isConnected() { return this._isConnected }
}

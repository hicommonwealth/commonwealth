// import io from 'socket.io-client';

import { WebsocketMessageType, WebsocketNamespaces } from 'types';
import { CWEvent } from '@commonwealth/chain-events';


export class ChainEventsNamespace {
	private ceNs;
	private _isConnected = false;

	constructor(io, domain: string) {
		this.ceNs = io.of(`${domain}/${WebsocketNamespaces.ChainEvents}`);
		this.ceNs.on('connect', this.onconnect.bind(this));
		this.ceNs.on('disconnect', this.ondisconnect.bind(this))
		this.ceNs.on(WebsocketMessageType.ChainEventNotification, this.onChainEvent.bind(this))
	}

	public addChainEventSubscription(chain: string, kind: string) {
		this.ceNs.emit('newSubscription', chain, kind)
	}

	public deleteChainEventSubscription(chain: string, kind: string) {
		this.ceNs.emit('deleteSubscription', chain, kind)
	}

	private onChainEvent(event: CWEvent) {
		// TODO: create notificationRow and add it to the list of notifications
	}

	private onconnect() {
		this._isConnected = true;
		console.log('Chain events namespace connected!')
	}

	private ondisconnect(reason) {
		this._isConnected = false;
		console.log(reason)
		// TODO: notify user that live chain-events notifications are disabled?
	}

	public get isConnected() { return this._isConnected }
}

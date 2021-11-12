// import io from 'socket.io-client';

import { WebsocketNamespaces } from 'types';


export class ChainEventsNamespace {
	private ceNs;
	private _isConnected = false;

	constructor(io, domain: string) {
		this.ceNs = io.of(`${domain}/${WebsocketNamespaces.ChainEvents}`);
		this.ceNs.on('connect', this.onconnect.bind(this));
		this.ceNs.on('disconnect', this.ondisconnect.bind(this))
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

import { io } from 'socket.io-client';


export const socket = io("ws://localhost:3002")

socket.on("connect", () => {
	console.log('WebSocket ID:', socket.id);
});

export class WebSocketController {

	public _socket;
	public _isConnected = false;

	public async init() {
		this._socket = io("ws//localhost:3002");
		this._socket.on('connect', this.onconnect.bind(this))
		this._socket.on('connect_error', this.onconnect_error.bind(this))
		this._socket.on('disconnect', this.ondisconnect.bind(this))
	}

	public async addListener(eventName: string, listener: (any) => void) {
		this._socket.on(eventName, listener);
	}

	public async removeListener(eventName: string, listener?: (any) => void) {
		this._socket.removeListener(eventName, listener)
	}

	public onconnect_error(err) {
		// TODO: https://socket.io/docs/v4/client-socket-instance/#connect_error
		console.error('An error occurred connecting to the WebSocket server', err);
	}

	public onconnect() {
		this._isConnected = true;
		console.log('Websocket connected! ID:', this._socket.id);
	}

	public ondisconnect(reason) {
		this._isConnected = false;
		switch (reason) {
			case 'io server disconnect':
				// client will not attempt reconnection
				console.log('The server has forcefully disconnected the socket with socket.disconnect()');
				break;
			case 'io client disconnect':
				// client will not attempt reconnection
				console.log('The socket was manually disconnected using socket.disconnect()');
				break;
			case 'ping timeout':
				console.log('The server did not send a PING within the pingInterval + pingTimeout range');
				break;
			case 'transport close':
				console.log('The connection was closed (example: the network was changed from WiFi to 4G)');
				break;
			case 'transport error':
				console.log('The connection has encountered an error (example: the server was killed during a HTTP long-polling cycle)');
				break;
			default:
				console.log('Unknown WebSocket disconnect reason');
				break;
		}
	}

	public get isConnected() { return this._isConnected }
}

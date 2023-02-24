import { ChainEventsNamespace } from 'controllers/server/socket/chainEventsNs';

export class WebSocketController {
  private _socket;
  private _isConnected = false;
  public readonly chainEventsNs: ChainEventsNamespace;

  public constructor() {
    // add all custom namespaces i.e. chain-event notifications, thread notifications
    this.chainEventsNs = new ChainEventsNamespace();
  }

  public async init(jwt: string) {
    const { io } = await import('socket.io-client');
    this._socket = io({
      transports: ['websocket'],
      query: { token: jwt },
    });
    this._socket.on('connect', this.onConnect.bind(this));
    this._socket.on('connect_error', this.onConnectError.bind(this));
    this._socket.on('disconnect', this.onDisconnect.bind(this));

    await this.chainEventsNs.init();
  }

  public async addListener(eventName: string, listener: (any) => void) {
    this._socket.on(eventName, listener);
  }

  public async removeListener(eventName: string, listener?: (any) => void) {
    this._socket.removeListener(eventName, listener);
  }

  private onConnectError(err) {
    // TODO: https://socket.io/docs/v4/client-socket-instance/#connect_error
    console.error('An error occurred connecting to the WebSocket server', err);
  }

  private onConnect() {
    this._isConnected = true;
    console.log('Websocket connected! ID:', this._socket.id);
  }

  private onDisconnect(reason) {
    this._isConnected = false;
    switch (reason) {
      case 'io server disconnect':
        // client will not attempt reconnection
        console.log(
          'The server has forcefully disconnected the socket with socket.disconnect()'
        );
        break;
      case 'io client disconnect':
        // client will not attempt reconnection
        console.log(
          'The socket was manually disconnected using socket.disconnect()'
        );
        break;
      case 'ping timeout':
        console.log(
          'The server did not send a PING within the pingInterval + pingTimeout range'
        );
        break;
      case 'transport close':
        console.log(
          'The connection was closed (example: the network was changed from WiFi to 4G)'
        );
        break;
      case 'transport error':
        console.log(
          'The connection has encountered an error (example: the server was killed during a HTTP long-polling cycle)'
        );
        break;
      default:
        console.log('Unknown WebSocket disconnect reason');
        break;
    }
  }

  public disconnect(): void {
    this._socket.disconnect();
  }

  public get isConnected() {
    return this._isConnected;
  }
}

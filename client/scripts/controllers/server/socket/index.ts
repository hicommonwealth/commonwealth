import { IWebsocketsPayload, WebsocketMessageType } from 'types';

// how long to wait after being disconnected
export const RECONNECT_DELAY = 5000;
// how often to send heartbeats to avoid being disconnected
export const HEARTBEAT_DELAY = 15000;

export type WebsocketMessageHandler = (payload: IWebsocketsPayload<any>) => void;
const DefaultWebsocketHandler = (
  key: WebsocketMessageType,
  payload: IWebsocketsPayload<any>
) => console.log(`No WS handler available for ${key}`);

class WebsocketController {
  public get ws() { return this._ws; }
  public _ws : WebSocket;

  public get isConnected() { return this._isConnected; }
  public _isConnected : boolean;

  public _onStatusChange : (b: boolean) => void;
  public _heartbeatTimer : number;
  public _init : (() => void);
  private _listeners: { [key in WebsocketMessageType]: WebsocketMessageHandler };

  constructor(url, jwt, onStatusChange) {
    this._listeners = Object.assign(
      {},
      ...Object.values(WebsocketMessageType)
        .map((key) => ({
          [key]: DefaultWebsocketHandler.bind(null, key),
        }))
    );
    this._onStatusChange = onStatusChange || (() => { });
    this._init = () => {
      // tear down old heartbeat timer
      if (this._heartbeatTimer) clearInterval(this._heartbeatTimer);
      const ws = new WebSocket(url);
      ws.onopen = this.onopen.bind(this);
      ws.onclose = this.onclose.bind(this);
      ws.onerror = this.onerror.bind(this);
      ws.onmessage = this.onmessage.bind(this);
      this._ws = ws;

      // set up new heartbeat time
      const heartbeatTimer = setInterval(() => {
        const heartbeat: IWebsocketsPayload<any> = { event: WebsocketMessageType.Heartbeat, jwt };
        if (ws.readyState !== ws.OPEN) return;
        ws.send(JSON.stringify(heartbeat));
      }, HEARTBEAT_DELAY);
      this._heartbeatTimer = +heartbeatTimer;
    };
    this._init();
  }

  public onopen() {
    this._isConnected = true;
    this._onStatusChange(true);
  }

  public onerror(error) {
    console.error('Websocket error', error);
  }

  public onclose() {
    console.log('Websocket closed');
    this._isConnected = false;
    this._onStatusChange(false);
    setTimeout(this._init, RECONNECT_DELAY);
  }

  public async onmessage(event: MessageEvent) {
    const payload: IWebsocketsPayload<any> = JSON.parse(event.data);
    console.log('Websocket received payload', payload);
    this._listeners[payload.event](payload);
  }

  // senders
  public send(event = WebsocketMessageType.Message, data, chain, address, jwt) {
    const payload : IWebsocketsPayload<any> = { event, jwt, address, chain, data };
    this._ws.send(JSON.stringify(payload));
  }

  // listeners
  public addListener(type: WebsocketMessageType, listener: WebsocketMessageHandler) {
    this._listeners[type] = listener;
  }
  public removeListener(type: WebsocketMessageType) {
    this._listeners[type] = DefaultWebsocketHandler.bind(null, type);
  }
  public getListeners() {
    return this._listeners;
  }
}

export default WebsocketController;

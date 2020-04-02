import { default as moment } from 'moment-twitter';

// how long to wait after being disconnected
export const RECONNECT_DELAY = 5000;
// how often to send heartbeats to avoid being disconnected
export const HEARTBEAT_DELAY = 15000;

export interface IScrollbackMessage {
  address: string;
  chain: string;
  room: string;
  created_at: string;
  text: string;
}

export interface IWebsocketsPayload {
  event: string; // options: 'message', 'heartbeat', 'typing', 'scrollback'
  text?: string;
  jwt?: string; // for outgoing payloads
  chain?: string; // for incoming payloads
  address?: string; // for incoming payloads
  data?: IScrollbackMessage[]; // for incoming 'scrollback' payloads
}

class WebsocketController {
  public get ws() { return this._ws; }
  public _ws : WebSocket;

  public get isConnected() { return this._isConnected; }
  public _isConnected : boolean;

  public _purpose : string;
  public _onStatusChange : (boolean) => void;
  public _heartbeatTimer : number;
  public _init : (() => void);
  public _listeners: Array<(str : string, author: string, author_chain: string, timestamp? : moment.Moment) => void>;

  constructor(url, purpose = 'chat', jwt, onStatusChange) {
    this._purpose = purpose;
    this._listeners = [];
    this._onStatusChange = onStatusChange || new Function();
    this._init = () => {
      // tear down old heartbeat timer
      if (this._heartbeatTimer) clearInterval(this._heartbeatTimer);
      // set up new websocket
      console.log(`${this._purpose}: websocket connecting to`, url);
      const ws = new WebSocket(url);
      ws.onopen = this.onopen.bind(this);
      ws.onclose = this.onclose.bind(this);
      ws.onerror = this.onerror.bind(this);
      ws.onmessage = this.onmessage.bind(this);
      this._ws = ws;
      // set up new heartbeat time
      const heartbeatTimer = setInterval(() => {
        const heartbeat : IWebsocketsPayload = { event: 'heartbeat', jwt };
        ws.send(JSON.stringify(heartbeat));
      }, HEARTBEAT_DELAY);
      this._heartbeatTimer = +heartbeatTimer;
    };
    this._init();
  }

  public onopen() {
    console.log(`${this._purpose}: websocket opened`);
    this._isConnected = true;
    this._onStatusChange(true);
  }
  public onerror() {
    console.log(`${this._purpose}: websocket error`);
  }
  public onclose() {
    console.log(`${this._purpose}: websocket closed`);
    this._isConnected = false;
    this._onStatusChange(false);
    setTimeout(this._init, RECONNECT_DELAY);
  }
  public async onmessage(event) {
    console.log(`${this._purpose}: websocket received message`);
    const payload : IWebsocketsPayload = JSON.parse(event.data);
    if (payload.event === 'message' || payload.event === 'heartbeat-pong') {
      console.log('Payload', payload);
    } else if (payload.event === 'server-event') {
      console.log('Server event payload', payload);
    } else {
      console.log(`${this._purpose}: received malformed message`, payload);
    }
  }

  // senders
  public send(event = 'message', text, account, jwt) {
    const payload : IWebsocketsPayload = {
      event,
      jwt,
      text,
      address: (account) ? account.address : null,
      chain: (account) ? account.chain.id : null,
    };
    this._ws.send(JSON.stringify(payload));
  }
  // listeners
  public addListener(listener) {
    const index = this._listeners.indexOf(listener);
    (index !== -1) ?
      console.log(`${this._purpose}: Attempted to add existing listener`) :
      this._listeners.push(listener);
  }
  public removeListener(listener) {
    const index = this._listeners.indexOf(listener);
    (index === -1) ?
      console.log(`${this._purpose}: Attempted to remove nonexistent listener`) :
      this._listeners.splice(index, 1);
  }
}

export default WebsocketController;

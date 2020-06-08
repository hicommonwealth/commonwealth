/*
import moment from 'moment-twitter';
import { Account } from 'models';
import app from 'state';
import WebsocketController, { IWebsocketsPayload } from '.';

class ChatController extends WebsocketController {
  private readonly _typingListeners: Array<() => void>;

  constructor(url, purpose = 'chat', jwt, onStatusChange) {
    super(url, purpose, jwt, onStatusChange);
    this._typingListeners = [];
  }

  public async onmessage(event) {
    console.log(`${this._purpose}: websocket received message`);
    const payload : IWebsocketsPayload = JSON.parse(event.data);
    if (payload.event === 'message') {
      this._listeners.map((listener) => listener(payload.text, payload.address, payload.chain));
    } else if (payload.event === 'typing') {
      this._typingListeners.map((listener) => listener());
    } else if (payload.event === 'scrollback') {
      const scrollback = payload.data.reverse();
      for (const message of scrollback) {
        const timestamp = moment(message.created_at);
        this._listeners.map((listener) => listener(message.text, message.address, message.chain, timestamp));
      }
    } else {
      console.log(`${this._purpose}: received malformed message`, payload);
    }
  }

  public initializeScrollback(jwt) {
    try {
      const payload : IWebsocketsPayload = { event: 'initScrollback', jwt };
      this._ws.send(JSON.stringify(payload));
    } catch (e) {
      // do nothing
    }
  }

  public sendTypingIndicator(jwt) {
    try {
      const payload : IWebsocketsPayload = { event: 'typing', jwt };
      this._ws.send(JSON.stringify(payload));
    } catch (e) {
      // do nothing
    }
  }

  // typing listeners
  public addTypingListener(listener) {
    const index = this._typingListeners.indexOf(listener);
    (index !== -1) ?
      console.log(`${this._purpose}: Attempted to add existing typing listener`) :
      this._typingListeners.push(listener);
  }
  public removeTypingListener(listener) {
    const index = this._typingListeners.indexOf(listener);
    (index === -1) ?
      console.log(`${this._purpose}: Attempted to remove nonexistent typing listener`) :
      this._typingListeners.splice(index, 1);
  }
}

export default ChatController;
*/

import moment from 'moment-twitter';

import app from 'state';
import { IWebsocketsPayload, WebsocketMessageType } from 'types';
import { Account } from 'models';
import { notifyError } from 'controllers/app/notifications';

import WebsocketController from '.';

export interface IScrollbackMessage {
  address: string;
  chain: string;
  room: string;
  created_at: string;
  text: string;
}

class ChatController extends WebsocketController {
  private readonly _typingListeners: Array<() => void>;

  constructor(url, jwt, onStatusChange) {
    super(url, jwt, onStatusChange);
    this._typingListeners = [];
  }

  public async onmessage(event) {
    console.log('chat: websocket received message');
    const payload = JSON.parse(event.data);
    if (payload.event === WebsocketMessageType.Message) {
      this.getListeners()[WebsocketMessageType.Message].call(this, payload.text, payload.address, payload.chain);
    } else if (payload.event === WebsocketMessageType.Typing) {
      this.getListeners()[WebsocketMessageType.Typing].call(this);
    } else if (payload.event === WebsocketMessageType.InitializeScrollback) {
      const scrollback = payload.data.reverse();
      for (const message of scrollback) {
        const timestamp = moment(message.created_at);
        this.getListeners()[WebsocketMessageType.InitializeScrollback]
          .call(this, message.text, message.address, message.chain, timestamp);
      }
    } else {
      console.log('chat: received malformed message', payload);
    }
  }

  public initializeScrollback(jwt) {
    try {
      const payload = { event: WebsocketMessageType.InitializeScrollback, jwt };
      this._ws.send(JSON.stringify(payload));
    } catch (e) {
      notifyError('Could not load past messages');
    }
  }

  public sendTypingIndicator(jwt) {
    try {
      const payload = { event: WebsocketMessageType.Typing, jwt };
      this._ws.send(JSON.stringify(payload));
    } catch (e) {
      console.error('Could not send typing indicator');
    }
  }
}

export default ChatController;

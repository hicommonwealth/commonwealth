import {WebsocketMessageType, WebsocketNamespaces} from 'types';
import app from 'state';
import {Notification, NotificationSubscription} from 'models';
import {io} from 'socket.io-client';

export class ChatNamesapce {
    private chatNs;
    private _isConnected = false;

    constructor() {
        this.chatNs = io(`/${WebsocketNamespaces.Chat}`, {
            transports: ['websocket'],
        });

        this.chatNs.on('connect', this.onConnect.bind(this));
        this.chatNs.on('disconnect', this.onDisconnect.bind(this));
        this.chatNs.on(WebsocketMessageType.ChatMessage, this.onChatMessage.bind(this));
    }

    private onChatMessage(chatChannel: string, chatMessage: string) {
        // TOODO: add the message to the appropriate channel
    }

    private onConnect() {
        this._isConnected = true;
        console.log('Chat namespace connected!')
    }

    private onDisconnect(reason) {
        this._isConnected = false;
        console.log(reason)
    }

    public get isConnected() {
        return this._isConnected;
    }
}

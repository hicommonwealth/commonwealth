import $ from 'jquery';
import app from 'state';
import { WebsocketMessageType, WebsocketNamespaces } from 'types';
import { io } from 'socket.io-client';

export const MESSAGE_PAGE_SIZE = 50;
export class ChatNamespace {
    private chatNs;
    private _isConnected = false;

    constructor() {
        this.chatNs = io(`/${WebsocketNamespaces.Chat}`, {
            transports: ['websocket'],
        });

        this.chatNs.on('connect', this.onConnect.bind(this));
        this.chatNs.on('disconnect', this.onDisconnect.bind(this));
    }

    public async addListener(eventName: string, listener: (any) => void) {
        this.chatNs.on(eventName, listener);
    }

    public async removeListener(eventName: string, listener?: (any) => void) {
        this.chatNs.off(eventName, listener);
    }

    public sendMessage(message: any) {
        this.chatNs.emit(WebsocketMessageType.ChatMessage, message)
    }

    public connectToChannels(channel_ids: number[]){
        this.chatNs.emit(WebsocketMessageType.JoinChatChannel, channel_ids)
    }

    public disconnectFromChannels(channel_ids: number[]){
        this.chatNs.emit(WebsocketMessageType.LeaveChatChannel, channel_ids)
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

    public async createChatChannel(name, community_id) {
        // check for admin?
        try {
            $.post(`${app.serverUrl()}/createChatChannel`, {
                jwt: app.user.jwt,
                name,
                community_id
            }).then((res) => {
                console.log(res)
            }).catch((err) => {
                throw new Error(`Failed to created chat channel with error: ${err}`)
            })
        } catch (e) {
            console.error(e)
        }
    }

    public async getChatMessages(community_id) {
        try {
            $.get(`${app.serverUrl()}/getChatMessages`, {
                community_id
            }).then((res) => {
                console.log(res)
                return res
            }).catch((err) => {
                throw new Error(`Failed to created chat channel with error: ${err}`)
            })
        } catch (e) {
            console.error(e)
            return []
        }
    }
}

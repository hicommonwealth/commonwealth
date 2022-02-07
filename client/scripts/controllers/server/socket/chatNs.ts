import $ from 'jquery';
import app from 'state';
import { WebsocketMessageType, WebsocketNamespaces } from 'types';
import { io } from 'socket.io-client';

export const MESSAGE_PAGE_SIZE = 50;

export const ChatErrors = {
    'NOT_LOGGED_IN': new Error('User must be logged in to load chat')
}

export class ChatNamespace {
    private chatNs;
    private _isConnected = false;
    private messages = {};

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

    public async createChatChannel(name, community_id, category) {
        // check for admin?
        try {
            $.post(`${app.serverUrl()}/createChatChannel`, {
                jwt: app.user.jwt,
                name,
                community_id,
                category
            }).then((res) => {
                console.log(res)
            }).catch((err) => {
                throw new Error(`Failed to created chat channel with error: ${err}`)
            })
        } catch (e) {
            console.error(e)
        }
    }

    public async getChatMessages() {
        if(!app.user.activeAccount || !app.activeChainId()) {
            // HACK: This gets called on load and beats the app's loading in a race. Can't have that.
            await new Promise(r => setTimeout(r, 1000));
        }

        if(!app.user.activeAccount) {
            throw ChatErrors.NOT_LOGGED_IN
        }
        try {
            const res = await $.get(`${app.serverUrl()}/getChatMessages`, {
                jwt: app.user.jwt,
                address: app.user.activeAccount.address,
                community_id: app.activeChainId()
            })

            if(res.status !== "200") {
                throw new Error('Failed to get chat messages')
            }

            const raw = JSON.parse(res.result)
            return raw
        } catch (e) {
            console.error(e)
            return []
        }
    }

    public async getChannels() {
        try {
            const messages = await this.getChatMessages()
            return messages.map(c => {return {id: c.id, category: c.category, name: c.name}})
        } catch (e) {
            console.error(e)
            return []
        }
    }

    public async deleteChatChannel(channel_id: number) {
        try {
            const response = await $.ajax({
                url: `${app.serverUrl()}/deleteChatChannel`,
                data: {channel_id, community_id: app.activeChainId()},
                type: 'DELETE'
            });

            if (response !== 'Success') {
                throw new Error("Failed to delete chat channel")
            }
            return true
        } catch (e) {
            console.error(e)
            return false
        }
    }

    public async deleteChatCategory(category: string) {
        try {
            const response = await $.ajax({
                url: `${app.serverUrl()}/deleteChatCategory`,
                data: {category, community_id: app.activeChainId()},
                type: 'DELETE'
            });

            if (response !== 'Success') {
                throw new Error("Failed to delete chat category")
            }
            return true
        } catch (e) {
            console.error(e)
            return false
        }
    }

    public async renameChatCategory(category: string, new_category: string) {
        try {
            const response = await $.ajax({
                url: `${app.serverUrl()}/renameChatCategory`,
                data: {category, new_category, community_id: app.activeChainId()},
                type: 'PUT'
            });

            if (response !== 'Success') {
                throw new Error("Failed to rename chat category")
            }
            return true
        } catch (e) {
            console.error(e)
            return false
        }
    }

    public async renameChatChannel(channel_id: number, name: string) {
        try {
            const response = await $.ajax({
                url: `${app.serverUrl()}/renameChatChannel`,
                data: {channel_id, name, community_id: app.activeChainId()},
                type: 'PUT'
            });

            if (response !== 'Success') {
                throw new Error("Failed to rename chat channel")
            }
            return true
        } catch (e) {
            console.error(e)
            return false
        }
    }
}

import $ from 'jquery';
import app from 'state';
import { WebsocketMessageNames, WebsocketNamespaces } from 'types';
import {io, Socket} from 'socket.io-client';
import _ from 'lodash';
import m from 'mithril';

export enum ChatErrors {
    NOT_LOGGED_IN='User must be logged in to load chat'
}

export interface IChannel {
    id: number,
    name: string,
    category: string,
    chain_id: string,
    created_at: string,
    updated_at: string,
    unread: number,
    ChatMessages?: any[]
}

export class ChatNamespace {
    private chatNs: Socket;
    private _isConnected = false;
    private _initialized = false;
    public channels: Record<string, IChannel> = {};

    constructor() {}

    public async init() {
        this.chatNs = io(`/${WebsocketNamespaces.Chat}`, {
            transports: ['websocket'],
        });

        this.chatNs.on('connect', this.onConnect.bind(this));
        this.chatNs.on('disconnect', this.onDisconnect.bind(this));
    }

    public async addListener(eventName: string, listener: (any) => void) {
        if (this.isConnected) {
            this.chatNs.on(eventName, listener);
        }
    }

    public async removeListener(eventName: string, listener?: (any) => void) {
        if (this.initialized()) this.chatNs.off(eventName, listener);
    }

    public sendMessage(message: Record<string, any>, channel: IChannel) {
        if (this.isConnected) {
            this.chatNs.emit(WebsocketMessageNames.ChatMessage, {
                socket_room: ChatNamespace.channelToRoomId(channel),
                ...message
            })
        }
    }

    public connectToChannels(channel_ids: string[]) {
        if (this.isConnected) this.chatNs.emit(WebsocketMessageNames.JoinChatChannel, channel_ids)
    }

    public disconnectFromChannels(channel_ids: string[]) {
        if (this.isConnected) this.chatNs.emit(WebsocketMessageNames.LeaveChatChannel, channel_ids)
    }

    private onConnect() {
        this._isConnected = true;
        console.log('Chat namespace connected!')

        if (!_.isEmpty(this.channels) && !this.initialized()) {
            this.initialize();
        }
    }

    private onDisconnect(reason) {
        this._isConnected = false;
        console.log(reason)
    }

    public get isConnected() {
        return this._isConnected;
    }

    public hasChannels() {
        return !_.isEmpty(this.channels)
    }

    public initialized() {
        return this._initialized
    }

    public async refreshChannels(channels: any) {
        this.channels = {}
        channels.forEach(c => {
            this.channels[c.id] = { unread: 0, ...c }
        });

        if (this.isConnected && !this.initialized()) {
            await this.initialize();
        }
    }

    public async initialize() {
        console.log("Initializing chat state")
        this.addListener(WebsocketMessageNames.ChatMessage, this.onMessage.bind(this))
        this.connectToChannels(Object.values(this.channels).map(ChatNamespace.channelToRoomId))
        this._initialized = true;
    }

    public async deinit() {
        this._initialized = false;
        this.removeListener(WebsocketMessageNames.ChatMessage, this.onMessage.bind(this))
        this.disconnectFromChannels(Object.values(this.channels).map(ChatNamespace.channelToRoomId))
        this.channels = {}
    }

    public async reinit() {
        console.log("re-initializing chat state")
        const raw_channels = await this.getChatMessages()
        const channels = {}
        raw_channels.forEach(c => {
            channels[c.id] = { unread: this.channels[c.id] || 0, ...c }
        });
        // channels is the new channels, this.channels is the old channels
        // new_channel_ids are the ids in channels which are not in this.channels
        const new_channel_ids = Object.keys(channels).filter(x => !Object.keys(this.channels).includes(x));
        // removed_channel_ids are the ids in this.channels which are not in channels
        const removed_channel_ids = Object.keys(this.channels).filter(x => !Object.keys(channels).includes(x));
        this.disconnectFromChannels(removed_channel_ids.map(id => this.channels[id]).map(ChatNamespace.channelToRoomId))
        this.connectToChannels(new_channel_ids.map(id => channels[id]).map(ChatNamespace.channelToRoomId))
        this.channels = channels
    }

    private onMessage(msg) {
        console.log("onMessage")
        // Ignore message if it is already in ChatMessages, last 5 msgs
        if(this.channels[msg.chat_channel_id].ChatMessages.slice(-5).includes(msg)) {
            return
        }
        this.channels[msg.chat_channel_id].ChatMessages.push(msg)
        this.channels[msg.chat_channel_id].unread++
        m.redraw();
    }

    public readMessages(channel_id: string) {
        this.channels[channel_id].unread = 0;
    }

    private static channelToRoomId(channel: IChannel) {
        return `${channel.chain_id}-${channel.id}`
    }

    public async createChatChannel(name, chain_id, category) {
        // this call will fail unless its an admin
        try {
            const res = await $.post(`${app.serverUrl()}/createChatChannel`, {
                jwt: app.user.jwt,
                name,
                chain_id,
                category
            })

            if(res.status !== "200"){
                throw new Error("Failed to create chat channel")
            }

            await this.reinit()
            return true
        } catch (e) {
            console.error(e)
        }
    }

    public async getChatMessages() {
        if(!app.user.activeAccount) {
            throw new Error(ChatErrors.NOT_LOGGED_IN)
        }
        try {
            const res = await $.get(`${app.serverUrl()}/getChatMessages`, {
                jwt: app.user.jwt,
                address: app.user.activeAccount.address,
                chain_id: app.activeChainId()
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

    public async deleteChatChannel(channel_id: number) {
        try {
            const response = await $.ajax({
                url: `${app.serverUrl()}/deleteChatChannel`,
                data: {
                    channel_id,
                    chain_id: app.activeChainId(),
                    jwt: app.user.jwt
                },
                type: 'DELETE'
            });

            if (response.status !== 'Success') {
                throw new Error("Failed to delete chat channel")
            }

            await this.reinit()
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
                data: {
                    category,
                    chain_id: app.activeChainId(),
                    jwt: app.user.jwt,
                },
                type: 'DELETE'
            });

            if (response.status !== 'Success') {
                throw new Error("Failed to delete chat category")
            }
            await this.reinit()
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
                data: {
                    category,
                    new_category,
                    chain_id: app.activeChainId(),
                    jwt: app.user.jwt
                },
                type: 'PUT'
            });

            if (response.status !== 'Success') {
                throw new Error("Failed to rename chat category")
            }
            await this.reinit()
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
                data: {
                    channel_id,
                    name,
                    chain_id: app.activeChainId(),
                    jwt: app.user.jwt
                },
                type: 'PUT'
            });

            if (response.status !== 'Success') {
                throw new Error("Failed to rename chat channel")
            }
            await this.reinit()
            return true
        } catch (e) {
            console.error(e)
            return false
        }
    }
}

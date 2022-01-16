import { Server } from 'socket.io';
import { addPrefix, factory } from '../../shared/logging';
import {
    WebsocketEngineEvents,
    WebsocketMessageType,
    WebsocketNamespaces,
} from '../../shared/types';
import { authenticate } from './index';

const log = factory.getLogger(addPrefix(__filename));

export function createChatNamespace(io: Server) {
    const ChatNs = io.of('/chat');
    io.use(authenticate)

    ChatNs.on('connection', (socket) => {
        log.info(`${socket.id} connected to Chat`);

        socket.on('disconnect', () => {
            log.info(`${socket.id} disconnected from Chat`);
        });

        socket.on(WebsocketMessageType.JoinChatChannel, (chatChannels: string[]) => {
            if (chatChannels.length > 0) {
                log.info(`${socket.id} joining ${JSON.stringify(chatChannels)}`);
                for (const channel of chatChannels) socket.join(channel);
            }
        })

        socket.on(WebsocketMessageType.LeaveChatChannel, (chatChannels: string[]) => {
            if (chatChannels.length > 0) {
                log.info(`${socket.id} leaving ${JSON.stringify(chatChannels)}`);
                for (const channel of chatChannels) socket.leave(channel);
            }
        })

        socket.on(WebsocketMessageType.ChatMessage, (chatChannel: string, chatMessage: string) => {
            ChatNs.to(chatChannel).emit(WebsocketMessageType.ChatMessage, chatMessage);
        })
    })

    io.of(`/${WebsocketNamespaces.Chat}`).adapter.on(
        WebsocketEngineEvents.CreateRoom,
        (room) => {
            log.info(`New chat channel created: ${room}`);
        }
    );

    io.of(`/${WebsocketNamespaces.Chat}`).adapter.on(
        WebsocketEngineEvents.DeleteRoom,
        (room) => {
            log.info(`Chat channel: ${room}, was deleted`);
        }
    )
}

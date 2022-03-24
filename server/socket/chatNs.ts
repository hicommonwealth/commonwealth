import {Server} from 'socket.io';
import moment from 'moment';
import {addPrefix, factory} from '../../shared/logging';
import {
    WebsocketEngineEvents,
    WebsocketMessageNames,
    WebsocketNamespaces,
} from '../../shared/types';
import {authenticate} from './index';

const log = factory.getLogger(addPrefix(__filename));

export function createChatNamespace(io: Server, pool) {
    const ChatNs = io.of(`/${WebsocketNamespaces.Chat}`);
    io.use(authenticate)

    ChatNs.on('connection', (socket) => {
        log.info(`${socket.id} connected to Chat`);

        socket.on('disconnect', () => {
            log.info(`${socket.id} disconnected from Chat`);
        });

        socket.on(WebsocketMessageNames.JoinChatChannel, (chatChannelIds: string[]) => {
            if (chatChannelIds.length > 0) {
                log.info(`${socket.id} joining ${JSON.stringify(chatChannelIds)}`);
                for (const channel of chatChannelIds) socket.join(channel);
            }
        })

        socket.on(WebsocketMessageNames.LeaveChatChannel, (chatChannelIds: string[]) => {
            if (chatChannelIds.length > 0) {
                log.info(`${socket.id} leaving ${JSON.stringify(chatChannelIds)}`);
                for (const channel of chatChannelIds) socket.leave(channel);
            }
        })

        socket.on(WebsocketMessageNames.ChatMessage, async (_message) => {
            const { message, address, chat_channel_id, now, socket_room } = _message
            const now_date = moment(now).toDate()
            // TODO: could not await the models be causing the high number of connections?
            // models.ChatMessage.create({ address, message, chat_channel_id, created_at: now_date, updated_at: now_date })
            //     .then((res) => {
            //         const { id, created_at } = res
            //         ChatNs
            //           .to(`${socket_room}`)
            //           .emit(WebsocketMessageNames.ChatMessage, { id, address, message, chat_channel_id, created_at });
            //     })
            //     .catch((e) => {
            //         socket.emit('Error', e)
            //     })
            const client = await pool.connect();
            const res = await client.query(`INSERT INTO "ChatMessages" (address, message, chat_channel_id, created_at, updated_at)
                                            VALUES (${address}, ${message}, ${chat_channel_id}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`);
            console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>", res);
            ChatNs.to(`${socket_room}`).emit(WebsocketMessageNames.ChatMessage, {
                id: res.id, address: res.address, message: res.message, chat_channel_id: res.chat_channel_id, created_at: res.created_at })
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

    return ChatNs
}

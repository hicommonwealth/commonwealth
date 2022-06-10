import {Server} from 'socket.io';
import moment from 'moment';
import {addPrefix, factory} from '../../shared/logging';
import {
    WebsocketEngineEvents,
    WebsocketMessageNames,
    WebsocketNamespaces,
 NotificationCategories } from '../../shared/types';
import { parseUserMentions } from '../util/parseUserMentions';
import {authenticate} from './index';
import {DB} from '../database';

const log = factory.getLogger(addPrefix(__filename));

const handleMentions = async (models: DB, socket: any, message: any, id: number, chain_id: string) => {
    // process mentions
    const bodyText = decodeURIComponent(message);
    let mentionedAddresses;
    try {
        const mentions = parseUserMentions(bodyText);
        if (mentions && mentions.length > 0) {
        mentionedAddresses = await Promise.all(
            mentions.map(async (mention) => {
            const user = await models.Address.findOne({
                where: {
                chain: mention[0] || null,
                address: mention[1],
                },
                include: [models.User, models.Role],
            });
            return user;
            })
        );
        mentionedAddresses = mentionedAddresses.filter((addr) => !!addr);
        }
    } catch (e) {
        return socket.emit('Error: Failed to parse mentions', e);
    }

    if (mentionedAddresses?.length > 0) {
        await Promise.all(
          mentionedAddresses.map(async (mentionedAddress) => {
            // some Addresses may be missing users, e.g. if the user removed the address
            if (!mentionedAddress.User) return;
            const shouldNotifyMentionedUser = true;
            if (shouldNotifyMentionedUser)
              await models.Subscription.emitNotifications(
                models,
                NotificationCategories.NewChatMention,
                `user-${mentionedAddress.User.id}`,
                {
                    messageId: id,
                    channelId: message.channel_id,
                    chain_id
                }
              );
          })
        );
      }
}

export function createChatNamespace(io: Server, models: DB) {
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
            console.log(_message)
            const now_date = moment(now).toDate()
            models.ChatMessage.create({ address, message, chat_channel_id, created_at: now_date, updated_at: now_date })
                .then(async (res) => {
                    const { id, created_at } = res
                    ChatNs
                      .to(`${socket_room}`)
                      .emit(WebsocketMessageNames.ChatMessage, { id, address, message, chat_channel_id, created_at });

                    const channel = await models.ChatChannel.findOne({where: { id: chat_channel_id }})
                    await handleMentions(models, socket, _message, id, channel.chain_id)
                })
                .catch((e) => {
                    socket.emit('Error', e)
                })
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

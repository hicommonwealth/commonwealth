import { addPrefix, factory } from 'common-common/src/logging';
import type { RedisCache } from 'common-common/src/redisCache';
import { NotificationCategories, RedisNamespaces, } from 'common-common/src/types';
import moment from 'moment';
import { Op } from 'sequelize';
import type { Server } from 'socket.io';
import { Action } from '../../shared/permissions';
import { WebsocketEngineEvents, WebsocketMessageNames, WebsocketNamespaces, } from '../../shared/types';
import emitNotifications from '../util/emitNotifications';
import { parseUserMentions } from '../util/parseUserMentions';
import { checkReadPermitted } from '../util/roles';
import { authenticate } from './index';
import type { DB } from '../models';

const log = factory.getLogger(addPrefix(__filename));

const handleMentions = async (
  models: DB,
  socket: any,
  message: any,
  id: number,
  chain_id: string
) => {
  // process mentions
  const bodyText = decodeURIComponent(message.message);
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
            include: [models.User, models.RoleAssignment],
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
        await emitNotifications(
          models,
          NotificationCategories.NewChatMention,
          `user-${mentionedAddress.User.id}`,
          {
            message_id: id,
            channel_id: message.chat_channel_id,
            chain_id,
            author_address: message.address,
            created_at: new Date(),
          }
        );
      })
    );
  }
};

export function createChatNamespace(
  io: Server,
  models: DB,
  redisCache?: RedisCache
) {
  const ChatNs = io.of(`/${WebsocketNamespaces.Chat}`);
  ChatNs.use(authenticate);

  ChatNs.on('connection', (socket) => {
    log.info(
      `socket_id = ${socket.id}, user_id = ${
        (<any>socket).user.id
      } connected to Chat`
    );

    socket.on('disconnect', () => {
      log.info(
        `socket_id = ${socket.id}, user_id = ${
          (<any>socket).user.id
        } disconnected from Chat`
      );
    });

    socket.on(
      WebsocketMessageNames.JoinChatChannel,
      async (chatChannelIds: string[]) => {
        console.log('Joining chat channels:', chatChannelIds);
        if (chatChannelIds.length > 0) {
          const channels = await models.ChatChannel.findAll({
            where: {
              id: {
                [Op.in]: chatChannelIds.map((x) => Number(x)),
              },
            },
          });

          try {
            if (channels?.length > 0) {
              await checkReadPermitted(
                models,
                channels[0].chain_id,
                Action.VIEW_CHAT_CHANNELS,
                (<any>socket)?.user?.id
              );
            }
          } catch (e) {
            console.log('Not permitted to join chat channel');
            return;
          }

          for (let i = 1; i < channels.length; i++) {
            if (channels[i - 1].chain_id != channels[i].chain_id) {
              socket.emit(
                WebsocketMessageNames.Error,
                "WARNING: Commonwealth does not support simultaneous joining of chatroom's for" +
                  'different chains'
              );
              return;
            }
          }

          log.info(
            `socket_id = ${socket.id}, user_id = ${
              (<any>socket).user.id
            } joining ${JSON.stringify(chatChannelIds)}`
          );
          for (const channel of chatChannelIds) socket.join(channel);
        }
      }
    );

    socket.on(
      WebsocketMessageNames.LeaveChatChannel,
      (chatChannelIds: string[]) => {
        if (chatChannelIds.length > 0) {
          log.info(
            `socket_id = ${socket.id}, user_id = ${
              (<any>socket).user.id
            } leaving ${JSON.stringify(chatChannelIds)}`
          );
          for (const channel of chatChannelIds) socket.leave(channel);
        }
      }
    );

    socket.on(WebsocketMessageNames.ChatMessage, async (_message) => {
      try {
        const { message, chat_channel_id, address } = _message;
        const now_date = moment(moment().toISOString()).toDate();
        const redisAddress = await redisCache.getKey(
          RedisNamespaces.Chat_Socket,
          (<any>socket).user.id
        );
        let finalAddress = redisAddress;

        // if the cached address and the address in the message don't match then either the user has switched addresses,
        // so we must check if they own that address and update the cache, or they are trying to spoof the address,
        // so we send back an authentication error
        if (address != redisAddress) {
          const userId = await models.Address.findOne({
            attributes: ['user_id'],
            where: {
              address,
              user_id: (<any>socket).user.id,
            },
          });

          if (!userId) {
            socket.emit(
              WebsocketMessageNames.Error,
              'WARNING: Authentication failed! Cannot send messages from an' +
                'address you do not own!'
            );
            return;
          }

          const redisResult = await redisCache.setKey(
            RedisNamespaces.Chat_Socket,
            (<any>socket).user.id,
            address
          );
          if (!redisResult) {
            socket.emit(
              WebsocketMessageNames.Error,
              'Redis address update failed!'
            );
          }

          finalAddress = address;
        }

        const isInRoom = ChatNs.adapter
          .socketRooms(socket.id)
          .has(String(chat_channel_id));
        if (!isInRoom) {
          socket.emit(
            WebsocketMessageNames.Error,
            'WARNING: You cannot send a message to a chat channel that you are not in!'
          );
          return;
        }

        const { id, created_at } = await models.ChatMessage.create({
          address: finalAddress,
          message,
          chat_channel_id,
          created_at: now_date,
          updated_at: now_date,
        });

        ChatNs.to(`${chat_channel_id}`).emit(
          WebsocketMessageNames.ChatMessage,
          {
            id,
            address: finalAddress,
            message,
            chat_channel_id,
            created_at,
          }
        );

        const channel = await models.ChatChannel.findOne({
          where: { id: chat_channel_id },
        });
        await handleMentions(models, socket, _message, id, channel.chain_id);
      } catch (e) {
        log.error(
          `An error occurred upon receiving a chat message: ${JSON.stringify(
            _message
          )}`,
          e
        );
      }
    });
  });

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
  );

  return ChatNs;
}

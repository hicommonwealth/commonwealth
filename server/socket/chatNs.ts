import { Server } from 'socket.io';
import moment from 'moment';
import { addPrefix, factory } from '../../shared/logging';
import {
  RedisNamespaces,
  WebsocketEngineEvents,
  WebsocketMessageNames,
  WebsocketNamespaces,
} from '../../shared/types';
import { authenticate } from './index';
import { DB } from '../database';
import { Op } from 'sequelize';
import { RedisCache } from '../util/redisCache';

const log = factory.getLogger(addPrefix(__filename));

export function createChatNamespace(io: Server, models: DB, redisCache?: RedisCache) {
  const ChatNs = io.of(`/${WebsocketNamespaces.Chat}`);
  ChatNs.use(authenticate);

  ChatNs.on('connection', (socket) => {
    log.info(`socket_id = ${socket.id}, user_id = ${(<any>socket).user.id} connected to Chat`);

    socket.on('disconnect', () => {
      log.info(`socket_id = ${socket.id}, user_id = ${(<any>socket).user.id} disconnected from Chat`);
    });

    socket.on(
      WebsocketMessageNames.JoinChatChannel,
      async (chatChannelIds: string[]) => {
        console.log("Joining chat channels:", chatChannelIds);
        if (chatChannelIds.length > 0) {
          const channels = await models.ChatChannel.findAll({
            where: {
              id: {
                [Op.in]: chatChannelIds.map((x) => Number(x)),
              },
            },
          });

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

          log.info(`socket_id = ${socket.id}, user_id = ${(<any>socket).user.id} joining ${JSON.stringify(chatChannelIds)}`);
          for (const channel of chatChannelIds) socket.join(channel);
        }
      }
    );

    socket.on(
      WebsocketMessageNames.LeaveChatChannel,
      (chatChannelIds: string[]) => {
        if (chatChannelIds.length > 0) {
          log.info(`socket_id = ${socket.id}, user_id = ${(<any>socket).user.id} leaving ${JSON.stringify(chatChannelIds)}`);
          for (const channel of chatChannelIds) socket.leave(channel);
        }
      }
    );

    socket.on(WebsocketMessageNames.ChatMessage, async (_message) => {
      try {
        const { message, chat_channel_id, address } = _message;
        const now_date = moment(moment().toISOString()).toDate();
        const redisAddress = await redisCache.getKey(RedisNamespaces.Chat_Socket, (<any>socket).user.id);
        let finalAddress = redisAddress;

        // if the cached address and the address in the message don't match then either the user has switched addresses,
        // so we must check if they own that address and update the cache, or they are trying to spoof the address, so we
        // send back an authentication error
        if (address != redisAddress) {
          const userId = await models.Address.findOne({
            attributes: ['user_id'],
            where: {
              address: address,
              user_id: (<any>socket).user.id
            },
          });

          if (!userId) {
            socket.emit(WebsocketMessageNames.Error, "WARNING: Authentication failed! Cannot send messages from an" +
              "address you do not own!");
            return;
          }

          const redisResult = await redisCache.setKey(RedisNamespaces.Chat_Socket, (<any>socket).user.id, address)
          if (!redisResult) {
            socket.emit(WebsocketMessageNames.Error, "Redis address update failed!");
          }

          finalAddress = address;
        }

        const isInRoom = ChatNs.adapter.socketRooms(socket.id).has(String(chat_channel_id));
        if (!isInRoom) {
          socket.emit(WebsocketMessageNames.Error, "WARNING: You cannot send a message to a chat channel that you are not in!");
          return;
        }

        const {id, created_at} = await models.ChatMessage.create({
          address: finalAddress,
          message,
          chat_channel_id,
          created_at: now_date,
          updated_at: now_date,
        })

        ChatNs.to(`${chat_channel_id}`).emit(WebsocketMessageNames.ChatMessage, {
          id,
          address: finalAddress,
          message,
          chat_channel_id,
          created_at,
        });
      } catch (e) {
        log.error(`An error occurred upon receiving a chat message: ${JSON.stringify(_message)}`, e);
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

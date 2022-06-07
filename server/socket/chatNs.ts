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
  io.use(authenticate);

  ChatNs.on('connection', (socket) => {
    log.info(`${socket.id} connected to Chat`);

    socket.on('disconnect', () => {
      log.info(`${socket.id} disconnected from Chat`);
    });

    socket.on(
      WebsocketMessageNames.JoinChatChannel,
      async (chatChannelIds: string[], activeAddress: string) => {
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

          const userId = models.Address.findOne({
            attributes: ['user_id'],
            where: {
              address: activeAddress,
            },
          });

          if (userId != (<any>socket).user.id) {
            socket.emit(WebsocketMessageNames.Error, "WARNING: Authentication failed! Cannot send messages from an" +
              "address you do not own!");
            return;
          }

          const cacheRes = await redisCache.setKey(RedisNamespaces.Chat_Socket, (<any>socket).user.id, activeAddress);
          if (!cacheRes) {
            socket.emit(WebsocketMessageNames.Error, "Joining channels failed!");
            return;
          }

          log.info(`${socket.id} joining ${JSON.stringify(chatChannelIds)}`);
          for (const channel of chatChannelIds) socket.join(channel);
        }
      }
    );

    socket.on(
      WebsocketMessageNames.LeaveChatChannel,
      (chatChannelIds: string[]) => {
        if (chatChannelIds.length > 0) {
          log.info(`${socket.id} leaving ${JSON.stringify(chatChannelIds)}`);
          for (const channel of chatChannelIds) socket.leave(channel);
        }
      }
    );

    socket.on(WebsocketMessageNames.ChatMessage, async (_message) => {
      const { message, chat_channel_id } = _message;
      const now_date = moment(Date.now()).toDate();
      const address = await redisCache.getKey(RedisNamespaces.Chat_Socket, (<any>socket).user.id);
      models.ChatMessage.create({
        address,
        message,
        chat_channel_id,
        created_at: now_date,
        updated_at: now_date,
      })
        .then((res) => {
          const { id, created_at } = res;
          ChatNs.to(`${chat_channel_id}`).emit(WebsocketMessageNames.ChatMessage, {
            id,
            address,
            message,
            chat_channel_id,
            created_at,
          });
        })
        .catch((e) => {
          socket.emit('Error', e);
        });
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

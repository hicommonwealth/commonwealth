import {
  HotShotsStats,
  ServiceKey,
  startHealthCheckLoop,
} from '@hicommonwealth/adapters';
import { logger, stats } from '@hicommonwealth/core';
import { emitEvent, models } from '@hicommonwealth/model';
import {
  Client,
  IntentsBitField,
  MessageType,
  ThreadChannel,
} from 'discord.js';
import v8 from 'v8';
import { config } from '../../config';
import { handleMessage, handleThreadChannel } from './handlers';

const log = logger(import.meta);
stats({
  adapter: HotShotsStats(),
});

let isServiceHealthy = false;

startHealthCheckLoop({
  service: ServiceKey.DiscordBotListener,
  // eslint-disable-next-line @typescript-eslint/require-await
  checkFn: async () => {
    if (!isServiceHealthy) {
      throw new Error('service not healthy');
    }
  },
});

log.info(
  `Node Option max-old-space-size set to: ${JSON.stringify(
    v8.getHeapStatistics().heap_size_limit / 1000000000,
  )} GB`,
);

async function startDiscordListener() {
  config.APP_ENV === 'local' && console.log(config);

  const client = new Client({
    intents: [
      IntentsBitField.Flags.Guilds,
      IntentsBitField.Flags.MessageContent,
      IntentsBitField.Flags.GuildMessages,
    ],
  });

  client.on('ready', () => {
    log.info('Discord bot is ready.');
    isServiceHealthy = true;
  });

  // event types can be found here: https://gist.github.com/koad/316b265a91d933fd1b62dddfcc3ff584

  client.on('threadDelete', (thread: ThreadChannel) => {
    handleThreadChannel(thread, 'DiscordThreadDeleted').catch((e) => {
      log.error('Failed to handle Discord thread deletion', e, {
        discord_thread_id: thread.id,
        title: thread.name,
        parent_channel_id: thread.parentId,
      });
    });
  });

  // only used for thread title updates - thread body are handled through the 'messageUpdate' event
  client.on(
    'threadUpdate',
    (oldThread: ThreadChannel, newThread: ThreadChannel) => {
      handleThreadChannel(
        newThread,
        'DiscordThreadTitleUpdated',
        oldThread,
      ).catch((e) => {
        log.error('Failed to handle Discord thread title update', e, {
          discord_thread_id: newThread.id,
          title: newThread.name,
          parent_channel_id: newThread.parentId,
        });
      });
    },
  );

  client.on('messageDelete', (message) => {
    handleMessage(client, message, 'DiscordThreadCommentDeleted').catch((e) => {
      log.error('Failed to delete Discord thread comment', e, {
        channel_id: message.channelId,
        guild_id: message.guildId,
        message_id: message.id,
      });
    });
  });

  client.on('messageUpdate', (_, newMessage) => {
    handleMessage(
      client,
      newMessage,
      newMessage.nonce
        ? 'DiscordThreadCommentUpdated'
        : 'DiscordThreadBodyUpdated',
    ).catch((e) => {
      log.error('Failed to update Discord thread comment', e, {
        channel_id: newMessage.channelId,
        guild_id: newMessage.guildId,
        message_id: newMessage.id,
      });
    });
  });

  client.on('messageCreate', (message) => {
    // this conditional prevents handling of messages like ChannelNameChanged which
    // are emitted inside a thread but which we do not want to replicate in the CW thread.
    // Thread/channel name changes are handled in threadUpdate since the that event comes
    // from the root thread/channel and thus contains the correct id.
    // Handling a name change from here would result in a new thread being created rather than updated on CW
    // since the id of the event is not the id of the actual post/thread.
    if (message.type === MessageType.Default) {
      handleMessage(
        client,
        message,
        message.nonce ? 'DiscordThreadCommentCreated' : 'DiscordThreadCreated',
      ).catch((e) => {
        log.error('Failed to create Discord thread comment', e, {
          channel_id: message.channelId,
          guild_id: message.guildId,
          message_id: message.id,
        });
      });
    }
  });

  client.on('guildMemberAdd', (member) => {
    const joinedAt = member.joinedAt || new Date();
    // TODO: convert discord user_id to common user_id
    emitEvent(models.Outbox, [
      {
        event_name: 'CommonDiscordServerJoined',
        event_payload: {
          user_id: 1,
          joined_date: joinedAt,
        },
      },
    ]).catch((e) => {
      log.error('Failed to emit CommonDiscordServerJoined event', e, {
        discord_user_id: member.id,
        discord_username: member.user.username,
        discord_server_join_date: joinedAt,
        common_user_id: 1,
      });
    });
  });

  await client.login(config.DISCORD.BOT_TOKEN);
}

startDiscordListener().catch((e) => {
  log.fatal(e);
});

import { logger, type Command } from '@hicommonwealth/core';
import { config } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { z } from 'zod/v4';
import { models } from '../../database';
import { emitEvent, publishCast } from '../../utils';

const log = logger(import.meta);

export function FarcasterCastWebhook(): Command<
  typeof schemas.FarcasterCastWebhook
> {
  return {
    ...schemas.FarcasterCastWebhook,
    auth: [],
    body: async ({ payload }) => {
      if (isFrameCast(payload)) {
        await handleFrameCast(payload);
      } else if (isReplyCast(payload)) {
        await handleReplyCast(payload);
      } else if (isContestBotMentioned(payload)) {
        await handleContestBotMentioned(payload);
      } else {
        log.warn(`payload not supported: ${JSON.stringify(payload, null, 2)}`);
      }
      return { status: 'ok' };
    },
  };
}

// ---

const isFrameCast = (
  payload: z.infer<typeof schemas.FarcasterCastWebhook.input>,
): boolean => {
  return payload.data?.embeds?.[0]?.url?.includes('/farcaster/contests/0x');
};

const isReplyCast = (
  payload: z.infer<typeof schemas.FarcasterCastWebhook.input>,
): boolean => {
  return (
    !isFrameCast(payload) && // must NOT have embed
    !!payload.data.author?.fid &&
    !!payload.data.parent_hash
  );
};

const isContestBotMentioned = (
  payload: z.infer<typeof schemas.FarcasterCastWebhook.input>,
) => {
  // TODO: perform better check of mention
  const didMentionBot =
    payload.data.text.includes('@commonlocal') ||
    payload.data.text.includes('@commondemo') ||
    payload.data.text.includes('@contestbot');
  return !isFrameCast(payload) && didMentionBot && payload.data.author?.fid;
};

// ---

const handleFrameCast = async (
  payload: z.infer<typeof schemas.FarcasterCastWebhook.input>,
) => {
  if (payload.type === 'cast.created') {
    await emitEvent(
      models.Outbox,
      [
        {
          event_name: 'FarcasterCastCreated',
          event_payload: payload.data,
        },
      ],
      null,
    );
  } else if (payload.type === 'cast.deleted') {
    await emitEvent(
      models.Outbox,
      [
        {
          event_name: 'FarcasterCastDeleted',
          event_payload: payload.data,
        },
      ],
      null,
    );
  } else {
    log.warn(
      `handleFrameCast: unsupported event: ${JSON.stringify(payload, null, 2)}`,
    );
  }
};

const handleReplyCast = async (
  payload: z.infer<typeof schemas.FarcasterCastWebhook.input>,
) => {
  const verified_address = await checkVerifiedAddress(payload);
  if (!verified_address) {
    return;
  }
  if (payload.type === 'cast.created') {
    await emitEvent(
      models.Outbox,
      [
        {
          event_name: 'FarcasterReplyCastCreated',
          event_payload: {
            ...payload.data,
            verified_address,
          },
        },
      ],
      null,
    );
  } else if (payload.type === 'cast.deleted') {
    await emitEvent(
      models.Outbox,
      [
        {
          event_name: 'FarcasterReplyCastDeleted',
          event_payload: {
            ...payload.data,
            verified_address,
          },
        },
      ],
      null,
    );
  } else {
    log.warn(
      `handleReplyCast: unsupported event: ${JSON.stringify(payload, null, 2)}`,
    );
  }
};

const handleContestBotMentioned = async (
  payload: z.infer<typeof schemas.FarcasterCastWebhook.input>,
) => {
  const verified_address = await checkVerifiedAddress(payload);
  if (!verified_address) {
    return;
  }
  await emitEvent(
    models.Outbox,
    [
      {
        event_name: 'FarcasterContestBotMentioned',
        event_payload: {
          ...payload.data,
          verified_address,
        },
      },
    ],
    null,
  );
};

// ----

const checkVerifiedAddress = async (
  payload: z.infer<typeof schemas.FarcasterCastWebhook.input>,
): Promise<string | null> => {
  // get user verified address
  const client = new NeynarAPIClient(config.CONTESTS.NEYNAR_API_KEY!);
  const { users } = await client.fetchBulkUsers([payload.data.author!.fid!]);
  const verified_address = users[0].verified_addresses.eth_addresses.at(0);
  if (!verified_address) {
    log.warn('Farcaster verified address not found');
    await publishCast(
      payload.data.hash,
      ({ username }) => `Hey @${username}, you need a verified address.`,
    );
    return null;
  }
  return verified_address;
};

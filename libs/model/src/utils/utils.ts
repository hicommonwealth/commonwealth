import { blobStorage, logger } from '@hicommonwealth/core';
import { EventPairs } from '@hicommonwealth/schemas';
import {
  getThreadUrl,
  safeTruncateBody,
  type AbiType,
} from '@hicommonwealth/shared';
import { createHash } from 'crypto';
import { hasher } from 'node-object-hash';
import {
  Model,
  ModelStatic,
  QueryTypes,
  Sequelize,
  Transaction,
} from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { isAddress } from 'web3-validator';
import { config } from '../config';
import type { OutboxAttributes } from '../models/outbox';

const log = logger(import.meta);

export function hashAbi(abi: AbiType): string {
  const hashInstance = hasher({
    coerce: true,
    sort: true,
    trim: true,
    alg: 'sha256',
    enc: 'hex',
  });
  return hashInstance.hash(abi);
}

/**
 * This functions takes either a new domain record or a pre-formatted event and inserts it into the Outbox. For core
 * domain events (e.g. new thread, new comment, etc.), the event_payload should be the complete domain record. The point
 * of this is that the emitter of a core domain event should never have to format the record itself. This
 * utility function centralizes event emission so that if any changes are required to the Outbox table or emission of
 * a specific event, this function can be updated without having to update the emitter code.
 */
export async function emitEvent(
  outbox: ModelStatic<Model<OutboxAttributes>>,
  values: Array<EventPairs>,
  transaction?: Transaction | null,
) {
  const records: Array<EventPairs> = [];
  for (const event of values) {
    if (!config.OUTBOX.BLACKLISTED_EVENTS.includes(event.event_name)) {
      records.push(event);
    } else {
      log.warn(
        `Event not inserted into outbox! ` +
          `The event "${event.event_name}" is blacklisted.
          Remove it from BLACKLISTED_EVENTS env in order to allow emitting this event.`,
        {
          event_name: event.event_name,
          allowed_events: config.OUTBOX.BLACKLISTED_EVENTS,
        },
      );
    }
  }

  if (records.length > 0) {
    await outbox.bulkCreate(values, { transaction });
  }
}

export function buildThreadContentUrl(communityId: string, threadId: number) {
  const fullContentUrl = getThreadUrl({
    chain: communityId,
    id: threadId,
  });
  // content url only contains path
  return new URL(fullContentUrl).pathname;
}

// returns community ID and thread ID from content url
export function decodeThreadContentUrl(contentUrl: string): {
  communityId: string | null;
  threadId: number | null;
} {
  if (contentUrl.startsWith('/farcaster/')) {
    return {
      communityId: null,
      threadId: null,
    };
  }
  if (!contentUrl.includes('/discussion/')) {
    throw new Error(`invalid content url: ${contentUrl}`);
  }
  const [communityId, threadId] = contentUrl
    .split('/discussion/')
    .map((part) => part.replaceAll('/', ''));
  return {
    communityId,
    threadId: parseInt(threadId, 10),
  };
}

/**
 * Checks whether two Ethereum addresses are equal. Throws if a provided string is not a valid EVM address.
 * Address comparison is done in lowercase to ensure case insensitivity.
 * @param address1 - The first Ethereum address.
 * @param address2 - The second Ethereum address.
 * @returns True if the strings are equal, valid EVM addresses - false otherwise.
 */
export function equalEvmAddresses(
  address1: string | unknown,
  address2: string | unknown,
): boolean {
  const isRealAddress = (address: string | unknown) => {
    if (!address || typeof address !== 'string' || !isAddress(address)) {
      throw new Error(`Invalid address ${address}`);
    }
    return address;
  };

  const validAddress1 = isRealAddress(address1);
  const validAddress2 = isRealAddress(address2);

  // Convert addresses to lowercase and compare
  const normalizedAddress1 = validAddress1.toLowerCase();
  const normalizedAddress2 = validAddress2.toLowerCase();

  return normalizedAddress1 === normalizedAddress2;
}

/**
 * Returns all contest managers associated with a thread by topic and community
 * @param sequelize - The sequelize instance
 * @param topicId - The topic ID of the thread
 * @param communityId - the community ID of the thread
 * @returns array of contest manager
 */
export async function getThreadContestManagers(
  sequelize: Sequelize,
  topicId: number,
  communityId: string,
): Promise<
  {
    contest_address: string;
  }[]
> {
  const contestManagers = await sequelize.query<{
    contest_address: string;
  }>(
    `
        SELECT cm.contest_address, cm.cancelled, cm.ended
        FROM "Communities" c
                 JOIN "ContestManagers" cm ON cm.community_id = c.id
        WHERE cm.topic_id = :topic_id
          AND cm.community_id = :community_id
          AND cm.cancelled IS NOT TRUE
          AND cm.ended IS NOT TRUE
    `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        topic_id: topicId,
        community_id: communityId,
      },
    },
  );
  return contestManagers;
}

export function removeUndefined(
  obj: Record<string, string | number | undefined>,
) {
  const result: Record<string, string | number | undefined> = {};

  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      result[key as string] = obj[key];
    }
  });

  return result;
}

const alchemyUrlPattern = /^https:\/\/[a-z]+-[a-z]+\.g\.alchemy\.com\/v2\//;

export function buildChainNodeUrl(url: string, privacy: 'private' | 'public') {
  if (url === '') return url;

  if (alchemyUrlPattern.test(url)) {
    const [baseUrl, key] = url.split('/v2/');
    if (key === config.ALCHEMY.APP_KEYS.PRIVATE && privacy !== 'private')
      return `${baseUrl}/v2/${config.ALCHEMY.APP_KEYS.PUBLIC}`;
    else if (key === config.ALCHEMY.APP_KEYS.PUBLIC && privacy !== 'public')
      return `${baseUrl}/v2/${config.ALCHEMY.APP_KEYS.PRIVATE}`;
    else if (key === '')
      return (
        url +
        (privacy === 'private'
          ? config.ALCHEMY.APP_KEYS.PRIVATE
          : config.ALCHEMY.APP_KEYS.PUBLIC)
      );
  }
  return url;
}

export function getChainNodeUrl({
  url,
  private_url,
}: {
  url: string;
  private_url?: string | null | undefined;
}) {
  if (!private_url || private_url === '')
    return buildChainNodeUrl(url, 'public');
  return buildChainNodeUrl(private_url, 'private');
}

export const R2_ADAPTER_KEY = 'blobStorageFactory.R2BlobStorage.Main';

/**
 * Limits content in the Threads.body and Comments.text columns to 2k characters (2kB)
 * Anything over this character limit is stored in Cloudflare R2.
 * 55% of threads and 90% of comments are shorter than this.
 * Anything over 2kB is TOASTed by Postgres so this limit prevents TOAST.
 */
const CONTENT_CHAR_LIMIT = 2_000;

/**
 * Uploads content to the appropriate R2 bucket if the content exceeds the
 * preview limit (CONTENT_CHAR_LIMIT),
 */
export async function uploadIfLarge(
  type: 'threads' | 'comments',
  content: string,
): Promise<{
  contentUrl: string | null;
  truncatedBody: string | null;
}> {
  if (content.length > CONTENT_CHAR_LIMIT) {
    const { url } = await blobStorage({
      key: R2_ADAPTER_KEY,
    }).upload({
      key: `${uuidv4()}.md`,
      bucket: type,
      content: content,
      contentType: 'text/markdown',
    });
    return { contentUrl: url, truncatedBody: safeTruncateBody(content, 500) };
  } else return { contentUrl: null, truncatedBody: null };
}

export function getSaltedApiKeyHash(apiKey: string, salt: string): string {
  return createHash('sha256')
    .update(apiKey + salt)
    .digest('hex');
}

export function buildApiKeySaltCacheKey(address: string) {
  return `salt_${address.toLowerCase()}`;
}

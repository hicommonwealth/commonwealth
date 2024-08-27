import { EventPairs, logger } from '@hicommonwealth/core';
import { getThreadUrl, type AbiType } from '@hicommonwealth/shared';
import { hasher } from 'node-object-hash';
import {
  Model,
  ModelStatic,
  QueryTypes,
  Sequelize,
  Transaction,
} from 'sequelize';
import { isAddress } from 'web3-validator';
import { config } from '../config';
import { OutboxAttributes } from '../models';

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
    if (config.OUTBOX.ALLOWED_EVENTS.includes(event.event_name)) {
      records.push(event);
    } else {
      log.warn(
        `Event not inserted into outbox! ` +
          `Add ${event.event_name} to the ALLOWED_EVENTS env var to enable emitting this event.`,
        {
          event_name: event.event_name,
          allowed_events: config.OUTBOX.ALLOWED_EVENTS,
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
  communityId: string;
  threadId: number;
} {
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
            SELECT
              cm.contest_address
            FROM "Communities" c
            JOIN "ContestManagers" cm ON cm.community_id = c.id
            JOIN "ContestTopics" ct ON cm.contest_address = ct.contest_address
            WHERE ct.topic_id = :topic_id
            AND cm.community_id = :community_id
            AND cm.cancelled = false
            AND (cm.ended IS NULL OR cm.ended = false)
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

export function removeUndefined(obj: object) {
  const result = {};

  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  });

  return result;
}

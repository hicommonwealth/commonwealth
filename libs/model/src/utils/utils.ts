import { EventNames, events, logger } from '@hicommonwealth/core';
import { getThreadUrl, type AbiType } from '@hicommonwealth/shared';
import { hasher } from 'node-object-hash';
import {
  Model,
  ModelStatic,
  QueryTypes,
  Sequelize,
  Transaction,
} from 'sequelize';
import { fileURLToPath } from 'url';
import { isAddress } from 'web3-validator';
import { z } from 'zod';
import { config } from '../config';
import { OutboxAttributes } from '../models';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

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

type EmitEventValues =
  | {
      event_name: EventNames.CommentCreated;
      event_payload: z.infer<typeof events.CommentCreated>;
    }
  | {
      event_name: EventNames.ThreadCreated;
      event_payload: z.infer<typeof events.ThreadCreated>;
    }
  | {
      event_name: EventNames.ThreadUpvoted;
      event_payload: z.infer<typeof events.ThreadUpvoted>;
    }
  | {
      event_name: EventNames.ChainEventCreated;
      event_payload: z.infer<typeof events.ChainEventCreated>;
    }
  | {
      event_name: EventNames.SnapshotProposalCreated;
      event_payload: z.infer<typeof events.SnapshotProposalCreated>;
    }
  | {
      event_name: EventNames.UserMentioned;
      event_payload: z.infer<typeof events.UserMentioned>;
    }
  | {
      event_name: EventNames.RecurringContestManagerDeployed;
      event_payload: z.infer<typeof events.RecurringContestManagerDeployed>;
    }
  | {
      event_name: EventNames.OneOffContestManagerDeployed;
      event_payload: z.infer<typeof events.OneOffContestManagerDeployed>;
    }
  | {
      event_name: EventNames.ContestStarted;
      event_payload: z.infer<typeof events.ContestStarted>;
    }
  | {
      event_name: EventNames.ContestContentAdded;
      event_payload: z.infer<typeof events.ContestContentAdded>;
    }
  | {
      event_name: EventNames.ContestContentUpvoted;
      event_payload: z.infer<typeof events.ContestContentUpvoted>;
    }
  | {
      event_name: EventNames.SubscriptionPreferencesUpdated;
      event_payload: z.infer<typeof events.SubscriptionPreferencesUpdated>;
    };

/**
 * This functions takes either a new domain record or a pre-formatted event and inserts it into the Outbox. For core
 * domain events (e.g. new thread, new comment, etc.), the event_payload should be the complete domain record. The point
 * of this is that the emitter of a core domain event should never have to format the record itself. This
 * utility function centralizes event emission so that if any changes are required to the Outbox table or emission of
 * a specific event, this function can be updated without having to update the emitter code.
 */
export async function emitEvent(
  outbox: ModelStatic<Model<OutboxAttributes>>,
  values: Array<EmitEventValues>,
  transaction?: Transaction | null,
) {
  const records: Array<EmitEventValues> = [];
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

/**
 * Creates a valid S3 asset url from an upload.Location url
 * @param uploadLocation The url returned by the Upload method of @aws-sdk/lib-storage
 * @param bucketName The name of the bucket or the domain (alias) of the bucket. Defaults to assets.commonwealth.im
 */
export function formatS3Url(
  uploadLocation: string,
  bucketName: string = 'assets.commonwealth.im',
): string {
  return (
    `https://${bucketName}/` + uploadLocation.split('amazonaws.com/').pop()
  );
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

function getWordAtIndex(
  inputString: string,
  index: number,
): {
  word: string;
  startIndex: number;
  endIndex: number;
} | null {
  if (index < 0 || index >= inputString.length || inputString[index] === ' ') {
    return null;
  }

  // Find the start of the word
  let start = index;
  while (start > 0 && inputString[start - 1] !== ' ') {
    start--;
  }

  // Find the end of the word
  let end = index;
  while (end < inputString.length && inputString[end] !== ' ') {
    end++;
  }

  // Extract and return the word
  return {
    word: inputString.substring(start, end),
    startIndex: start,
    endIndex: end,
  };
}

/**
 * This function attempts to safely truncates thread or comment content by not splicing urls
 * or user mentions e.g. `[@Tim](/profile/id/118532)`. If the body contains only a URL or a user mention,
 * and it does not fit in the provided length, the function will return '...'
 * @param body A thread or comment body.
 * @param length The maximum length of the returned string. Note, the returned string may be shorter than this length.
 */
export function safeTruncateBody(body: string, length: number = 500): string {
  if (body.length <= length) return body;

  // Regular expressions to identify URLs and user mentions
  const urlRegex = /((https?:\/\/|www\.)[^\s]+)$/gi;
  const mentionRegex = /\[@[^\]]+\]\(\/profile\/id\/\d+\)$/g;

  const result = getWordAtIndex(body, length);
  if (!result) return body.substring(0, length);

  const match = urlRegex.exec(result.word) || mentionRegex.exec(result.word);
  if (!match) return body.substring(0, length);
  else if (match && result.startIndex === 0 && result.endIndex > length) {
    return '...';
  } else {
    return body.substring(0, result.startIndex);
  }
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
            AND cm.ended = false
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

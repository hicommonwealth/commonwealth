import { EventNames, events, logger } from '@hicommonwealth/core';
import { getThreadUrl, type AbiType } from '@hicommonwealth/shared';
import { hasher } from 'node-object-hash';
import { Model, ModelStatic, Transaction } from 'sequelize';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { config } from './config';
import { OutboxAttributes } from './models';

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

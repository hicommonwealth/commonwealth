import { EventNames, events } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import * as schemas from '@hicommonwealth/schemas';
import type { AbiType } from '@hicommonwealth/shared';
import { hasher } from 'node-object-hash';
import { Model, ModelStatic, Transaction } from 'sequelize';
import { fileURLToPath } from 'url';
import { z } from 'zod';
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
      event_payload: z.infer<typeof schemas.Comment>;
    }
  | {
      event_name: EventNames.ThreadCreated;
      event_payload: z.infer<typeof schemas.Thread>;
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
      event_name: EventNames.ThreadUpvoted;
      event_payload: z.infer<typeof events.ThreadUpvoted>;
    };

// Load with env var?
const ALLOWED_EVENTS = process.env.ALLOWED_EVENTS
  ? process.env.ALLOWED_EVENTS.split(',')
  : [];

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
    if (ALLOWED_EVENTS.includes(event.event_name)) {
      records.push(event);
    } else {
      log.warn(
        `Event not inserted into outbox! ` +
          `Add ${event.event_name} to the ALLOWED_EVENTS env var to enable emitting this event.`,
        {
          event_name: event.event_name,
          allowed_events: ALLOWED_EVENTS,
        },
      );
    }
  }

  if (records.length > 0) {
    await outbox.bulkCreate(values, { transaction });
  }
}

import { EventNames, events } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { entities } from '@hicommonwealth/schemas';
import type { AbiType } from '@hicommonwealth/shared';
import { hasher } from 'node-object-hash';
import { fileURLToPath } from 'node:url';
import { Model, ModelCtor, Transaction } from 'sequelize';
import { z } from 'zod';
import { OutboxAttributes, OutboxModelStatic } from './models';

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
      event_payload: z.infer<typeof entities.Comment>;
    }
  | {
      event_name: EventNames.ThreadCreated;
      event_payload: z.infer<typeof entities.Thread>;
    }
  | {
      event_name: EventNames.ChainEventCreated;
      event_payload: z.infer<typeof events.ChainEventCreated>;
    }
  | {
      event_name: EventNames.SnapshotProposalCreated;
      event_payload: z.infer<typeof events.SnapshotProposalCreated>;
    };

// Load with env var?
const DISALLOWED_EVENTS = process.env.DISALLOWED_EVENTS
  ? process.env.DISALLOWED_EVENTS.split(',')
  : [];

/**
 * This functions takes either a new domain record or a pre-formatted event and inserts it into the Outbox. For core
 * domain events (e.g. new thread, new comment, etc.), the event_payload should be the complete domain record. The point
 * of this is that the emitter of a core domain event should never have to format the record itself. This
 * utility function centralizes event emission so that if any changes are required to the Outbox table or emission of
 * a specific event, this function can be updated without having to update the emitter code.
 */
export async function emitEvent(
  outbox: ModelCtor<Model<OutboxAttributes>> | OutboxModelStatic,
  values: Array<EmitEventValues>,
  transaction?: Transaction | null,
) {
  const records: Array<EmitEventValues> = [];
  for (const event of values) {
    if (!DISALLOWED_EVENTS.includes(event.event_name)) {
      records.push(event);
    } else {
      log.warn('Event not inserted into outbox!', {
        event_name: event.event_name,
        disallowed_events: DISALLOWED_EVENTS,
      });
    }
  }

  if (records.length > 0) {
    await outbox.bulkCreate(values, { transaction });
  }
}

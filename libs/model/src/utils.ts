import { schemas } from '@hicommonwealth/core';
import type { AbiType } from '@hicommonwealth/shared';
import { hasher } from 'node-object-hash';
import { Model, ModelCtor, Transaction } from 'sequelize';
import { z } from 'zod';
import { OutboxAttributes, OutboxModelStatic } from './models';

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
      event_name: schemas.EventNames.CommentCreated;
      event_payload: z.infer<typeof schemas.entities.Comment>;
    }
  | {
      event_name: schemas.EventNames.ThreadCreated;
      event_payload: z.infer<typeof schemas.entities.Thread>;
    }
  | {
      event_name: schemas.EventNames.ChainEventCreated;
      event_payload: z.infer<typeof schemas.events.ChainEventCreated>;
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
    }
  }

  console.log(records);

  if (records.length > 0) {
    await outbox.bulkCreate(values, { transaction });
  }
}

import { Events, Projection, events, handleEvent } from '@hicommonwealth/core';
import { delay } from '@hicommonwealth/shared';
import { Op } from 'sequelize';
import { ZodUndefined } from 'zod';
import { models } from '../../src/database';

type EventSchemas = typeof events;

/**
 * Drains the outbox: Simulates the outbox being drained by the infrastructure and
 * pushing the events to a projection
 */
export async function drainOutbox<E extends Events>(
  events: E[],
  factory: () => Projection<{ [Name in E]: EventSchemas[Name] }, ZodUndefined>,
  from?: Date,
) {
  const drained = await models.Outbox.findAll({
    where: {
      event_name: {
        [Op.in]: events,
      },
      created_at: {
        [Op.gte]: from ?? new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      },
    },
  });
  const projection = factory();
  for await (const { event_name, event_payload } of drained) {
    handleEvent(projection, {
      name: event_name,
      payload: event_payload,
    });
    console.log(`>>> ${event_name} >>> ${factory.name}`);
  }
  // take a breather
  await delay(500);
}

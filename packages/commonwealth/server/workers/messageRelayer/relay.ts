import {
  Broker,
  BrokerPublications,
  Outbox,
  stats,
} from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import type { DB } from '@hicommonwealth/model';
import { fileURLToPath } from 'node:url';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { MESSAGE_RELAYER_PREFETCH } from '../../config';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

export async function relay(broker: Broker, models: DB): Promise<number> {
  const publishedEventIds: number[] = [];
  await models.sequelize.transaction(async (transaction) => {
    const events = await models.sequelize.query<z.infer<typeof Outbox>>(
      `
      SELECT *
      FROM "Outbox"
      WHERE relayed = false
      ORDER BY created_at ASC
      LIMIT :prefetch
      FOR UPDATE SKIP LOCKED;
    `,
      {
        transaction,
        type: QueryTypes.SELECT,
        replacements: { prefetch: MESSAGE_RELAYER_PREFETCH },
      },
    );

    for (const event of events) {
      try {
        const res = await broker.publish(BrokerPublications.MessageRelayer, {
          name: event.event_name,
          payload: event.event_payload,
        });

        // don't publish subsequent messages to preserve message order
        if (!res) {
          log.fatal('Message relayer could not publish event', undefined, {
            event,
          });
          break;
        }
        publishedEventIds.push(event.event_id);
        stats().incrementBy(
          'messageRelayerPublished',
          publishedEventIds.length,
        );
      } catch (e) {
        log.fatal('Message relayer failed to publish event', e, {
          event,
        });
        break;
      }
    }

    if (publishedEventIds.length > 0) {
      await models.Outbox.update(
        {
          relayed: true,
        },
        {
          where: {
            relayed: false,
            event_id: publishedEventIds,
          },
          transaction,
        },
      );
    }
  });

  return publishedEventIds.length;
}

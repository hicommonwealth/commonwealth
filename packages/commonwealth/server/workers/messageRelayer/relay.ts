import { Broker, BrokerTopics, schemas, stats } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import type { DB } from '@hicommonwealth/model';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { MESSAGE_RELAYER_PREFETCH } from '../../config';

const log = logger(__filename);

const EventNameTopicMap: Partial<Record<schemas.Events, BrokerTopics>> = {
  SnapshotProposalCreated: BrokerTopics.SnapshotListener,
  DiscordMessageCreated: BrokerTopics.DiscordListener,
  ChainEventCreated: BrokerTopics.ChainEvent,
} as const;

export async function relay(broker: Broker, models: DB): Promise<number> {
  const publishedEventIds: number[] = [];
  await models.sequelize.transaction(async (transaction) => {
    const events = await models.sequelize.query<
      z.infer<typeof schemas.entities.Outbox>
    >(
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
        const res = await broker.publish(EventNameTopicMap[event.event_name], {
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

import { PinoLogger } from '@hicommonwealth/adapters';
import { Broker, BrokerTopics, logger, schemas } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';

const log = logger(PinoLogger()).getLogger(__filename);

const EventNameTopicMap: Partial<Record<schemas.Events, BrokerTopics>> = {
  SnapshotProposalCreated: BrokerTopics.SnapshotListener,
  DiscordMessageCreated: BrokerTopics.DiscordListener,
} as const;

// lock to ensure only a single call to relay is executing at all times
let relayingState = false;

export function isRelaying() {
  return relayingState;
}

export async function relay(broker: Broker): Promise<number> {
  relayingState = true;
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
      LIMIT 20
      FOR UPDATE SKIP LOCKED;
    `,
      { transaction, type: QueryTypes.SELECT },
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
        publishedEventIds.push(event.id);
      } catch (e) {
        log.fatal('Message relayer failed to publish event', e, {
          event,
        });
        break;
      }
    }

    await models.sequelize.query(
      `
      UPDATE "Outbox"
      SET relayed = true,
      WHERE relayed = false -- ensures query ignores irrelevant child partitions
        AND id IN (:eventIds)
    `,
      {
        replacements: {
          eventIds: publishedEventIds,
        },
        transaction,
        type: QueryTypes.UPDATE,
      },
    );
  });

  relayingState = false;
  return publishedEventIds.length;
}

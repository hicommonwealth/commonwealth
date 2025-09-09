import { logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';

const log = logger(import.meta);

async function main(eventIds: string[]) {
  if (eventIds.length === 0) {
    log.info(
      'No event_ids provided. Usage: ./dlq-replay.ts <event_id_1> <event_id_2> ...',
    );
    return;
  }

  log.info(`Replaying events: ${eventIds.join(', ')}...`);
  for (const eventId of eventIds) {
    const transaction = await models.sequelize.transaction();
    try {
      const dlqEvent = await models.Dlq.findOne({
        where: { event_id: eventId },
        transaction,
      });

      if (!dlqEvent) {
        log.warn(
          `Event with event_id ${eventId} not found in Dlq table. Skipping.`,
        );
        await transaction.rollback();
        continue;
      }

      const [updateCount] = await models.Outbox.update(
        { relayed: false },
        { where: { event_id: eventId }, transaction },
      );

      if (updateCount === 0) {
        log.warn(
          `Event with event_id ${eventId} not found in Outbox table. It may have been archived. Skipping.`,
        );
        await transaction.rollback();
        continue;
      }

      await models.Dlq.destroy({
        where: { event_id: eventId },
        transaction,
      });

      await transaction.commit();
      log.info(`Successfully replayed event ${eventId}.`);
    } catch (error) {
      await transaction.rollback();
      log.error(`Error replaying event ${eventId}:`, error);
    }
  }
}

const eventIdsToReplay = process.argv.slice(2);
main(eventIdsToReplay).catch((err) => {
  log.error(err);
  process.exit(1);
});

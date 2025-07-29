import { logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';
import { GraphileTask, TaskPayloads } from '@hicommonwealth/model/services';
import { config } from '../../../config';
import { bulkInsertAllocations, MagnaAllocationsResponse } from '../../magna';

const log = logger(import.meta);

export const magnaSyncTask: GraphileTask<typeof TaskPayloads.MagnaSync> = {
  input: TaskPayloads.MagnaSync,
  fn: async () => {
    if (!config.MAGNA.API_URL || !config.MAGNA.API_KEY) {
      log.info('MagnaSync cron job not started: missing Magna API config');
      return;
    }
    log.info('Starting MagnaSync cron job');
    try {
      // load next batch of users to sync with Magna
      const batch = await models.HistoricalAllocations.findAll({
        where: { magna_synced_at: null },
        limit: config.MAGNA.BATCH_SIZE,
        order: [['created_at', 'ASC']],
      });
      // bulk insert allocations into Magna
      // TODO: this has to be idempotent, in case next step to ack fails
      const result: MagnaAllocationsResponse = await bulkInsertAllocations(
        config.MAGNA.API_URL,
        config.MAGNA.API_KEY,
        batch.map((a) => a.toJSON()),
      );
      log.info(
        `Magna API sync successful, received ${result.result.items.length} allocations`,
      );
      // acknowledge synced users in DB
      await models.HistoricalAllocations.update(
        { magna_synced_at: new Date() },
        { where: { user_id: batch.map(({ user_id }) => user_id) } },
      );
    } catch (err) {
      log.error('Error syncing with Magna API', err);
    }
    log.info('MagnaSync job completed');
  },
};

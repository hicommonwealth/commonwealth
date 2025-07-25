import { logger } from '@hicommonwealth/core';
import { GraphileTask, TaskPayloads } from '@hicommonwealth/model/services';
import { config } from '../../../config';
import {
  fetchMagnaAllocations,
  MagnaAllocationsRequest,
  MagnaAllocationsResponse,
} from '../../magna';

const log = logger(import.meta);

export const magnaSyncTask: GraphileTask<typeof TaskPayloads.MagnaSync> = {
  input: TaskPayloads.MagnaSync,
  fn: async (_payload, _helpers) => {
    if (!config.MAGNA.API_URL || !config.MAGNA.API_KEY) {
      log.info('MagnaSync cron job not started: missing Magna API config');
      return;
    }
    log.info('Starting MagnaSync cron job');
    // 1. Prepare request (mocked)
    // TODO: load tokenId and other params from your platform data
    const request: MagnaAllocationsRequest = {
      tokenId: 'your_token_id',
      limit: 10,
    };

    // 2. Sync with Magna API (type-safe)
    try {
      const result: MagnaAllocationsResponse = await fetchMagnaAllocations(
        request,
        config.MAGNA.API_URL,
        config.MAGNA.API_KEY,
      );
      log.info(
        `Magna API sync successful, received ${result.result.items.length} allocations`,
      );
      // 3. Update records with last_sync_time (mocked)
      // await models.YourModel.update({ last_sync_time: new Date() }, { where: { ... } });
    } catch (err) {
      log.error('Error syncing with Magna API', err);
    }
    log.info('MagnaSync job completed');
  },
};

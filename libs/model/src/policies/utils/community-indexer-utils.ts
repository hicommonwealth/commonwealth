import { logger } from '@hicommonwealth/core';
import { ClankerToken } from '@hicommonwealth/schemas';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import moment from 'moment';
import { z } from 'zod';

const log = logger(import.meta);

export async function fetchClankerTokens(
  cutoffDate: Date,
  onPage: (tokens: Array<z.infer<typeof ClankerToken>>) => Promise<void>,
) {
  const axiosInstance = axios.create();
  axiosRetry(axiosInstance, {
    retries: 3,
    retryDelay: (retryCount) => 5000 * Math.pow(2, retryCount - 1),
    retryCondition: (error) =>
      error.response?.status === 429 || (error.response?.status ?? 0) >= 500,
  });

  let pageNum = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const url = `https://www.clanker.world/api/tokens?sort=desc&page=${pageNum}&pair=all&partner=all&presale=all`;
    log.debug(`fetching: ${url}`);

    try {
      // Use the axios instance with retry logic
      const res = await axiosInstance.get<{
        data: Array<z.infer<typeof ClankerToken>>;
      }>(url);

      // If no tokens were returned, we're done
      if (res.data.data.length === 0) {
        log.debug('No more tokens found');
        break;
      }

      // Filter tokens by cutoffDate
      const validTokens = res.data.data.filter((t) =>
        moment(t.created_at).isAfter(cutoffDate),
      );

      // Pass any valid tokens to the callback
      if (validTokens.length > 0) {
        await onPage(validTokens);
      }

      // Check if the oldest token is older than our cutoff date
      const oldestToken = res.data.data[res.data.data.length - 1];
      if (moment(oldestToken.created_at).isBefore(cutoffDate)) {
        break;
      }

      // Move to the next page
      pageNum++;
    } catch (err: any) {
      log.error(`Error fetching clanker tokens: ${err.message}`);
      throw err;
    }
  }
}

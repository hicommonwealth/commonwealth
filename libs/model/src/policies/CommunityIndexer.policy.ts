import { command, logger, Policy } from '@hicommonwealth/core';
import {
  ClankerToken,
  CommunityIndexer as CommunityIndexerSchema,
  EventNames,
  EventPairs,
  events,
} from '@hicommonwealth/schemas';
import { ChainBase, ChainType } from '@hicommonwealth/shared';
import axios from 'axios';
import { ValidChains } from 'evm-protocols/src/common-protocol';
import { kebabCase } from 'lodash';
import moment from 'moment';
import { Literal } from 'sequelize/lib/utils';
import { z } from 'zod';
import { CreateCommunity } from '../community';
import { models, sequelize } from '../database';
import { systemActor } from '../middleware';
import { emitEvent } from '../utils';

const log = logger(import.meta);

const inputs = {
  CommunityIndexerTimerTicked: events.CommunityIndexerTimerTicked,
  ClankerTokenFound: events.ClankerTokenFound,
};

type CommunityIndexerStatus = z.infer<typeof CommunityIndexerSchema>['status'];

async function setIndexerStatus(
  indexerId: string,
  status: CommunityIndexerStatus,
) {
  const toUpdate: {
    status: CommunityIndexerStatus;
    last_checked?: Literal;
  } = {
    status,
  };
  if (status === 'pending') {
    toUpdate.last_checked = sequelize.literal('NOW()');
  }
  return await models.CommunityIndexer.update(toUpdate, {
    where: {
      id: indexerId,
    },
  });
}

const sleepAsync = (delay: number) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, delay);
  });

async function fetchClankerTokens(
  cutoffDate: Date,
  onPage: (tokens: Array<z.infer<typeof ClankerToken>>) => Promise<void>,
) {
  let numRetries = 3;
  let backoff = 5000;
  let pageNum = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const url = `https://www.clanker.world/api/tokens?sort=desc&page=${pageNum}&pair=all&partner=all&presale=all`;

    try {
      const res = await axios.get<{
        data: Array<z.infer<typeof ClankerToken>>;
      }>(url);

      // Stop fetching if no more tokens
      if (res.data.data.length === 0) {
        log.debug('No more tokens found');
        break;
      }

      // Filter tokens by cutoffDate
      const validTokens = res.data.data.filter((t) =>
        moment(t.created_at).isAfter(cutoffDate),
      );

      if (validTokens.length > 0) {
        await onPage(validTokens);
      }

      // Check if the oldest token is older than the cutoffDate
      const oldestToken = res.data.data[res.data.data.length - 1];
      if (moment(oldestToken.created_at).isBefore(cutoffDate)) {
        break;
      }

      // Reset retries and move to the next page
      numRetries = 3;
      backoff = 5000;
      pageNum++;
    } catch (err: any) {
      // Retry if rated limited
      if (err.response?.status === 429) {
        log.warn('Encountered clanker API rate limiting');
        if (numRetries <= 0) {
          throw new Error('Max retries reached due to rate limiting');
        }
        await sleepAsync(backoff);
        numRetries--;
        backoff *= 2;
        continue;
      }

      log.error(`Error fetching clanker tokens: ${err.message}`);
      throw err;
    }
  }
}

export function CommunityIndexer(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      CommunityIndexerTimerTicked: async ({ payload }) => {
        const indexers = await models.CommunityIndexer.findAll({
          where: {
            status: 'idle',
          },
        });

        for (const indexer of indexers) {
          try {
            await setIndexerStatus(indexer.id, 'pending');

            if (indexer.id === 'clanker') {
              // start fetching tokens where indexer last left off, or at the beginning
              const cutoffDate = indexer.last_checked || new Date(0);
              await fetchClankerTokens(cutoffDate, async (tokens) => {
                const eventsToEmit: Array<EventPairs> = tokens.map((token) => ({
                  event_name: EventNames.ClankerTokenFound,
                  event_payload: token,
                }));
                await emitEvent(models.Outbox, eventsToEmit);
              });
            } else {
              throw new Error(`indexer not implemented: ${indexer.id}`);
            }

            await setIndexerStatus(indexer.id, 'idle');
          } catch (err) {
            await setIndexerStatus(indexer.id, 'error');
            log.error(`failed to index for ${indexer.id}`, err as Error);
            throw err;
          }
        }
      },
      ClankerTokenFound: async ({ payload }) => {
        const id = kebabCase(payload.name);

        const chainNode = await models.ChainNode.findOne({
          where: {
            name: 'Base',
            eth_chain_id: ValidChains.Base,
          },
        });

        await command(CreateCommunity(), {
          actor: systemActor({}),
          payload: {
            id,
            type: ChainType.Token,
            name: payload.name,
            default_symbol: payload.symbol,
            base: ChainBase.Ethereum,
            social_links: [],
            website: `https://www.clanker.world/clanker/${payload.contract_address}`,
            directory_page_enabled: false,
            tags: [],
            chain_node_id: chainNode!.id!,
            indexer: 'clanker',
            token_address: payload.contract_address,
          },
        });
      },
    },
  };
}

import { command, logger, Policy } from '@hicommonwealth/core';
import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { config } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import {
  ClankerToken,
  CommunityIndexer as CommunityIndexerSchema,
  EventNames,
  EventPairs,
  events,
} from '@hicommonwealth/schemas';
import { ChainBase, ChainType } from '@hicommonwealth/shared';
import axios from 'axios';
import lo from 'lodash';
import moment from 'moment';
import { Literal } from 'sequelize/lib/utils';
import { z } from 'zod';
import { CreateCommunity } from '../community';
import { models, sequelize } from '../database';
import { systemActor } from '../middleware';
import { mustExist } from '../middleware/guards';
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
    log.debug(`fetching: ${url}`);

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
        log.debug(`CommunityIndexerTimerTicked`);
        const indexers = await models.CommunityIndexer.findAll({});

        const pendingIndexers = indexers.filter(
          (idx) => idx.status === 'pending',
        );
        if (pendingIndexers.length > 0) {
          return;
        }

        const idleIndexers = indexers.filter((idx) => idx.status === 'idle');

        for (const indexer of idleIndexers) {
          try {
            log.debug(`starting community indexer ${indexer.id}`);
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
        const id = lo.kebabCase(payload.name);

        // let uploadedImageUrl: string | null = null;
        // if (payload.img_url) {
        //   const filename = `${uuidv4()}.jpeg`;
        //   const content = await axios.get(payload.img_url!);
        //   const { url } = await blobStorage().upload({
        //     key: filename,
        //     bucket: 'assets',
        //     content: content.data,
        //   });
        //   uploadedImageUrl = url;
        // }

        const chainNode = await models.ChainNode.scope(
          'withPrivateData',
        ).findOne({
          where: {
            name: 'Base',
            eth_chain_id: commonProtocol.ValidChains.Base,
          },
        });
        mustExist('Chain Node', chainNode);

        const web3 = commonProtocol.createPrivateEvmClient({
          rpc: chainNode.private_url!,
          privateKey: config.WEB3.PRIVATE_KEY,
        });
        const adminAddress = await models.Address.findOne({
          where: {
            address: web3.eth.defaultAccount!,
          },
        });
        mustExist('Admin Address', adminAddress);

        const createCommunityPayload: z.infer<
          typeof schemas.CreateCommunity.input
        > = {
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
        };
        // if (uploadedImageUrl) {
        //   createCommunityPayload.icon_url = uploadedImageUrl;
        // }

        await command(CreateCommunity(), {
          actor: systemActor({
            id: adminAddress.user_id!,
            address: adminAddress.address,
          }),
          payload: createCommunityPayload,
        });

        log.debug(`created clanker community: ${id}`);
      },
    },
  };
}

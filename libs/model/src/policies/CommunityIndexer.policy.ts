import { command, logger, Policy } from '@hicommonwealth/core';
import {
  CommunityIndexer as CommunityIndexerSchema,
  events,
} from '@hicommonwealth/schemas';
import { ChainBase, ChainType } from '@hicommonwealth/shared';
import { ValidChains } from 'evm-protocols/src/common-protocol';
import { kebabCase } from 'lodash';
import { Op } from 'sequelize';
import { z } from 'zod';
import { CreateCommunity } from '../community';
import { models } from '../database';
import { systemActor } from '../middleware';

const log = logger(import.meta);

const inputs = {
  CommunityIndexerTimerTicked: events.CommunityIndexerTimerTicked,
  ClankerCommunityFound: events.ClankerCommunityFound,
};

type CommunityIndexerStatus = z.infer<typeof CommunityIndexerSchema>['status'];

async function setIndexerStatus(
  indexerId: string,
  status: CommunityIndexerStatus,
) {
  return await models.CommunityIndexer.update(
    {
      status,
    },
    {
      where: {
        id: indexerId,
      },
    },
  );
}

export function CommunityIndexer(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      CommunityIndexerTimerTicked: async ({ payload }) => {
        const indexers = await models.CommunityIndexer.findAll({
          where: {
            status: 'idle',
            last_checked: {
              [Op.lt]: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
            },
          },
        });

        for (const indexer of indexers) {
          try {
            await setIndexerStatus(indexer.id, 'pending');
            // TODO: implement
            await setIndexerStatus(indexer.id, 'idle');
          } catch (err) {
            await setIndexerStatus(indexer.id, 'error');
            log.error(`failed to index for ${indexer.id}`, err as Error);
            throw err;
          }
        }
      },
      ClankerCommunityFound: async ({ payload }) => {
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
          },
        });
      },
    },
  };
}

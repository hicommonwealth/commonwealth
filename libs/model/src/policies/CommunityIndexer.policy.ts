import { command, logger, Policy } from '@hicommonwealth/core';
import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { config } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import {
  CommunityIndexer as CommunityIndexerSchema,
  EventNames,
  EventPairs,
  events,
} from '@hicommonwealth/schemas';
import { ChainBase, ChainType } from '@hicommonwealth/shared';
import lo from 'lodash';
import moment from 'moment';
import { Literal } from 'sequelize/lib/utils';
import { z } from 'zod';
import { CreateCommunity } from '../community';
import { models, sequelize } from '../database';
import { systemActor } from '../middleware';
import { mustExist } from '../middleware/guards';
import { emitEvent } from '../utils';
import { fetchClankerTokens } from './utils/community-indexer-utils';

const log = logger(import.meta);

const inputs = {
  CommunityIndexerTimerTicked: events.CommunityIndexerTimerTicked,
  ClankerTokenFound: events.ClankerTokenFound,
};

type CommunityIndexerStatus = z.infer<typeof CommunityIndexerSchema>['status'];

type SetIndexerStatusParams =
  | { status: 'pending'; lastTokenTimestamp?: Date }
  | {
      status: Exclude<CommunityIndexerStatus, 'pending'>;
      lastTokenTimestamp?: never;
    };

async function setIndexerStatus(
  indexerId: string,
  { status, lastTokenTimestamp }: SetIndexerStatusParams,
) {
  const toUpdate: {
    status: CommunityIndexerStatus;
    last_checked?: Literal;
  } = {
    status,
  };
  if (lastTokenTimestamp) {
    toUpdate.last_checked = sequelize.literal('NOW()');
  }
  return await models.CommunityIndexer.update(toUpdate, {
    where: {
      id: indexerId,
    },
  });
}

export function CommunityIndexer(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      CommunityIndexerTimerTicked: async () => {
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
            await setIndexerStatus(indexer.id, { status: 'pending' });

            if (indexer.id === 'clanker') {
              // start fetching tokens where indexer last left off, or at the beginning
              const cutoffDate = indexer.last_checked || new Date(0);
              await fetchClankerTokens(cutoffDate, async (tokens) => {
                const eventsToEmit: Array<EventPairs> = tokens.map((token) => ({
                  event_name: EventNames.ClankerTokenFound,
                  event_payload: token,
                }));
                await emitEvent(models.Outbox, eventsToEmit);
                // update indexer last_checked timestamp so that
                // old tokens are not refetched
                const lastTokenTimestamp = moment(
                  tokens.at(-1)!.created_at,
                ).toDate();
                await setIndexerStatus(indexer.id, {
                  status: 'pending',
                  lastTokenTimestamp,
                });
              });
            } else {
              throw new Error(`indexer not implemented: ${indexer.id}`);
            }

            await setIndexerStatus(indexer.id, { status: 'idle' });
          } catch (err) {
            await setIndexerStatus(indexer.id, { status: 'error' });
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
          tags: ['clanker'],
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

import { InvalidState, logger, type Query } from '@hicommonwealth/core';
import { config } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { alchemyGetTokenPrices } from '@hicommonwealth/shared';
import { Includeable } from 'sequelize';
import { z } from 'zod';
import { models } from '../database';
import { PinTokenErrors } from './PinToken.command';

const log = logger(import.meta);

export function GetPinnedTokens(): Query<typeof schemas.GetPinnedTokens> {
  return {
    ...schemas.GetPinnedTokens,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { community_ids, with_chain_node, with_price } = payload;
      if (community_ids.length === 0) return [];
      const parsedIds = community_ids.split(',').filter((v) => v !== '');
      if (parsedIds.length === 0) return [];

      const include: Includeable[] = [];
      if (with_chain_node || with_price) {
        include.push({
          model: models.ChainNode,
          required: true,
        });
      }

      const tokens = (
        await models.PinnedToken.findAll({
          where: {
            community_id: parsedIds,
          },
          include,
        })
      ).map((t) => t.get({ plain: true }));

      let prices: Awaited<ReturnType<typeof alchemyGetTokenPrices>> | undefined;
      if (with_price && tokens.length > 0) {
        prices = await alchemyGetTokenPrices({
          alchemyApiKey: config.ALCHEMY.APP_KEYS.PRIVATE,
          tokenSources: tokens.map((t) => ({
            contractAddress: t.contract_address,
            alchemyNetworkId: t.ChainNode?.alchemy_metadata?.network_id || '',
          })),
        });

        if (
          !Array.isArray(prices?.data) ||
          prices.data.length !== 1 ||
          prices.data[0].error
        ) {
          log.error(PinTokenErrors.FailedToFetchPrice, undefined, {
            prices,
          });
          throw new InvalidState(PinTokenErrors.FailedToFetchPrice);
        }
      }

      const finalTokens = (tokens || []).map((t) => {
        const temp: z.infer<typeof schemas.PinnedTokenWithPrices> = { ...t };
        if (!with_chain_node) {
          delete temp.ChainNode;
        }
        if (with_price && prices) {
          const foundPrice = prices.data.find(
            (p) => p.address === t.contract_address,
          );
          temp.prices = foundPrice?.prices;
        }
        return { ...temp };
      });

      return finalTokens;
    },
  };
}

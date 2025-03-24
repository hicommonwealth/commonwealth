import { InvalidState, logger, type Query } from '@hicommonwealth/core';
import { config } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { buildPaginatedResponse } from '@hicommonwealth/schemas';
import { alchemyGetTokenPrices } from '@hicommonwealth/shared';
import { Includeable } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';
import { formatSequelizePagination } from '../../utils/paginationUtils';
import { PinTokenErrors } from './PinToken.command';

const log = logger(import.meta);

export function GetPinnedTokens(): Query<typeof schemas.GetPinnedTokens> {
  return {
    ...schemas.GetPinnedTokens,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const {
        community_ids,
        with_chain_node,
        with_price,
        limit,
        cursor,
        order_by,
        order_direction,
      } = payload;

      //
      const whereClause: { community_id?: string[] } = {};

      if (community_ids) {
        if (community_ids.length === 0) {
          return buildPaginatedResponse([], 0, { limit, cursor });
        }
        const parsedIds = community_ids.split(',').filter((v) => v !== '');
        if (parsedIds.length === 0) {
          return buildPaginatedResponse([], 0, { limit, cursor });
        }
        whereClause.community_id = parsedIds;
      }

      const include: Includeable[] = [
        {
          model: models.Community,
          required: true,
          attributes: [
            'name',
            'default_symbol',
            'icon_url',
            'community_indexer_id',
          ],
        },
      ];
      if (with_chain_node || with_price) {
        include.push({
          model: models.ChainNode,
          required: true,
        });
      }

      const totalResults = await models.PinnedToken.count({
        where: whereClause,
      });

      const paginationOptions = formatSequelizePagination({
        limit,
        cursor,
        order_by: order_by || 'created_at',
        order_direction: order_direction || 'DESC',
      });

      const tokens = (
        await models.PinnedToken.findAll({
          where: whereClause,
          include,
          ...paginationOptions,
        })
      ).map((t) => t.get({ plain: true }));

      let prices: Awaited<ReturnType<typeof alchemyGetTokenPrices>> | undefined;
      if (with_price && tokens.length > 0) {
        try {
          const tokenSources = tokens
            .filter((t) => !t.Community?.community_indexer_id) // don't get prices for indexed tokens
            .map((t) => ({
              contractAddress: t.contract_address,
              alchemyNetworkId: t.ChainNode?.alchemy_metadata?.network_id || '',
            }));

          if (tokenSources.length > 0) {
            prices = await alchemyGetTokenPrices({
              alchemyApiKey: config.ALCHEMY.APP_KEYS.PRIVATE,
              tokenSources,
            });

            if (
              !Array.isArray(prices?.data) ||
              prices.data.length !== 1 ||
              prices.data[0].error
            ) {
              throw new InvalidState(
                `${PinTokenErrors.FailedToFetchPrice}: ${prices.data.map((p) => p.error).join(', ')}`,
              );
            }
          }
        } catch (err) {
          log.warn(`Failed to get prices: ${err}`);
        }
      }

      const finalTokens = (tokens || []).map((t) => {
        const temp: z.infer<typeof schemas.PinnedTokenWithPrices> = {
          ...t,
          name: t.Community?.name || '',
          symbol: t.Community?.default_symbol || '',
          icon_url: t.Community?.icon_url || '',
        };
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

      return buildPaginatedResponse(finalTokens, totalResults, {
        limit,
        cursor,
        is_page_cursor: true,
      });
    },
  };
}

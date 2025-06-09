import { logger, type Query } from '@hicommonwealth/core';
import { config, models } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { mustExist } from '../../middleware';

const errorObject = {
  network: '',
  address: '',
  currency: '',
  data: [],
};

const log = logger(import.meta);

export function GetTokenInfoAlchemy(): Query<
  typeof schemas.GetTokenInfoAlchemy
> {
  return {
    ...schemas.GetTokenInfoAlchemy,
    auth: [],
    body: async ({ payload }) => {
      const { eth_chain_id, token_address } = payload;

      const node = await models.ChainNode.findOne({
        where: { eth_chain_id },
        attributes: ['alchemy_metadata'],
      });
      mustExist('ChainNode', node);

      const network = node?.alchemy_metadata?.network_id;

      if (!network) {
        log.error(
          `network for chain_id ${eth_chain_id} not supported by alchemy`,
        );
        return errorObject;
      }

      const today = new Date();
      // Need two days ago because we need
      // today's price + yesterday's price for 24 hour change
      const twoDaysAgo = new Date();
      twoDaysAgo.setHours(today.getHours() - 2 * 24);

      const response = await fetch(
        `https://api.g.alchemy.com/prices/v1/${config.ALCHEMY.APP_KEYS.PRIVATE}/tokens/historical`,
        {
          method: 'POST',
          headers: {
            'content-Type': 'application/json',
            accept: 'application/json',
          },
          body: JSON.stringify({
            startTime: twoDaysAgo.toISOString(),
            endTime: today.toISOString(),
            interval: '1d',
            withMarketData: true,
            network,
            address: token_address,
          }),
        },
      );

      const json = await response.json();

      if (json?.error) {
        log.error(
          json.error.message ||
            'Unknown error from alchemy in GetTokenInfoAlchemy query',
        );
        return errorObject;
      }

      // Update has_pricing for any pinned tokens with this address
      const pinnedTokens = await models.PinnedToken.findAll({
        where: {
          contract_address: token_address,
          chain_node_id: node.id!,
        },
      });

      if (pinnedTokens.length > 0) {
        const hasPricing = Array.isArray(json.data) && json.data.length > 0;
        console.log('hasPricing', hasPricing);
        await Promise.all(
          pinnedTokens.map((token) =>
            token.update({ has_pricing: hasPricing }),
          ),
        );
      }

      return schemas.GetTokenInfoAlchemy.output.parse(json);
    },
  };
}

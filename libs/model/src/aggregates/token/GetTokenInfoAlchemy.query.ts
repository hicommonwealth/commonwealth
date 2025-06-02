import { logger, type Query } from '@hicommonwealth/core';
import { config, models } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';

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
      return schemas.GetTokenInfoAlchemy.output.parse(json);
    },
  };
}

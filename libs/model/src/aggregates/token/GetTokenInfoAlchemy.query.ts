import { AppError, type Query } from '@hicommonwealth/core';
import { ValidChains } from '@hicommonwealth/evm-protocols';
import { config } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { Network } from 'alchemy-sdk';
import fetch from 'node-fetch';
import { z } from 'zod';
import { mustExist } from '../../middleware';

const ethChainIdToAlchemy: Record<number, Network> = {
  [ValidChains.Base]: Network.BASE_MAINNET,
  [ValidChains.SepoliaBase]: Network.BASE_SEPOLIA,
};

export function GetTokenInfoAlchemy(): Query<
  typeof schemas.GetTokenInfoAlchemy
> {
  return {
    ...schemas.GetTokenInfoAlchemy,
    auth: [],
    body: async ({ payload }) => {
      const { eth_chain_id, token_address } = payload;

      const network = ethChainIdToAlchemy[eth_chain_id];
      if (!network) {
        throw new AppError(
          `network for chain_id ${eth_chain_id} not supported by alchemy`,
        );
      }

      mustExist('network not supported by alchemy', network);

      const today = new Date();
      const yesterday = new Date();
      yesterday.setHours(today.getHours() - 24);

      const response = await fetch(
        `https://api.g.alchemy.com/prices/v1/${config.ALCHEMY.APP_KEYS.PRIVATE}/tokens/historical`,
        {
          method: 'POST',
          headers: {
            'content-Type': 'application/json',
            'accept:': 'application/json',
          },
          body: JSON.stringify({
            startTime: yesterday.toISOString(),
            endTime: today.toISOString(),
            interval: '1d',
            withMarketData: true,
            network,
            address: token_address,
          }),
        },
      );

      const json = await response.json();

      return json as z.infer<typeof schemas.GetTokenInfoAlchemy.output>;
    },
  };
}

import { logger, type Query } from '@hicommonwealth/core';
import { ValidChains } from '@hicommonwealth/evm-protocols';
import * as schemas from '@hicommonwealth/schemas';
import { Network } from 'alchemy-sdk';

const ethChainIdToAlchemy: Record<number, Network> = {
  [ValidChains.Base]: Network.BASE_MAINNET,
  [ValidChains.SepoliaBase]: Network.BASE_SEPOLIA,
};

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
      return {
        network: 'base-mainnet',
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        currency: 'usd',
        data: [
          {
            value: '0.9998999514',
            timestamp: '2025-04-27T00:00:00Z',
            marketCap: '62076749988.76833',
            totalVolume: '4206296030.2634163',
          },
          {
            value: '0.9998999514',
            timestamp: '2025-04-28T00:00:00Z',
            marketCap: '62076749988.76833',
            totalVolume: '4206296030.2634163',
          },
        ],
      };
      // const { eth_chain_id, token_address } = payload;
      //
      // const network = ethChainIdToAlchemy[eth_chain_id];
      // if (!network) {
      //   log.error(`network for chain_id ${eth_chain_id} not supported by alchemy`);
      //   return errorObject;
      // }
      //
      // mustExist('network not supported by alchemy', network);
      //
      // const today = new Date();
      // const yesterday = new Date();
      // yesterday.setHours(today.getHours() - 24);
      //
      // const response = await fetch(
      //   `https://api.g.alchemy.com/prices/v1/${config.ALCHEMY.APP_KEYS.PRIVATE}/tokens/historical`,
      //   {
      //     method: 'POST',
      //     headers: {
      //       'content-Type': 'application/json',
      //       'accept': 'application/json',
      //     },
      //     body: JSON.stringify({
      //       startTime: yesterday.toISOString(),
      //       endTime: today.toISOString(),
      //       interval: '1d',
      //       withMarketData: true,
      //       network,
      //       address: token_address,
      //     }),
      //   },
      // );
      //
      // const json = await response.json();
      //
      // if (json?.error) {
      //   log.error(json.error.message || 'Unknown error from alchemy in GetTokenInfoAlchemy query');
      //   return errorObject;
      // }
      // return json as z.infer<typeof schemas.GetTokenInfoAlchemy.output>;
    },
  };
}

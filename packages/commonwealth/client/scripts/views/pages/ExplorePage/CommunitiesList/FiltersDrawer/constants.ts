import { Community } from '@hicommonwealth/schemas';
import { ChainBase, CommunityType } from '@hicommonwealth/shared';
import {
  BASE_ID,
  BLAST_ID,
  POLYGON_ETH_CHAIN_ID,
  SONEIUM_ID,
} from 'views/components/CommunityInformationForm/constants';
import { z } from 'zod';
import { CommunitySortDirections, CommunitySortOptions } from './types';

export const communityBases = {
  Cosmos: ChainBase.CosmosSDK,
  Ethereum: ChainBase.Ethereum,
  Solana: ChainBase.Solana,
};

export const communityChains = {
  Base: parseInt(BASE_ID),
  Polygon: POLYGON_ETH_CHAIN_ID,
  Blast: parseInt(BLAST_ID),
  Soneium: parseInt(SONEIUM_ID),
  ArbitrumMainnet: 42161,
  EthereumMainnet: 1,
  Linea: 59144,
  Optimism: 10,
  HorizenEON: 1323,
  Harmony: 1666600000,
  Gnosis: 100,
  FuseMainnet: 1262,
  Fantom: 250,
  Core: 1116,
  Celo: 42220,
  BSC: 56,
  Avalanche: 43114,
  Arthera: 10242,
};

export const communityTypes = Object.keys(CommunityType) as CommunityType[];

const getPickedKeys = (schema: z.AnyZodObject) => {
  return Object.keys(schema.shape);
};

export const communitySortOptionsLabelToKeysMap = {
  // this would correctly throw TS errors if the community schema removes the specified keys
  [CommunitySortOptions.MostRecent]: getPickedKeys(
    Community.pick({ created_at: true }),
  )[0],
  [CommunitySortOptions.MemberCount]: getPickedKeys(
    Community.pick({ profile_count: true }),
  )[0],
  [CommunitySortOptions.ThreadCount]: getPickedKeys(
    Community.pick({ lifetime_thread_count: true }),
  )[0],
};

export const sortOrderLabelsToDirectionsMap = {
  [CommunitySortDirections.Ascending]: 'ASC',
  [CommunitySortDirections.Descending]: 'DESC',
};

export const communityNetworks: string[] = ['ERC20'];

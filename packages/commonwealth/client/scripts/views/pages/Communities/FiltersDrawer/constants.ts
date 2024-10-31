import { ChainBase, ChainNetwork, CommunityType } from '@hicommonwealth/shared';
import {
  BASE_ID,
  BLAST_ID,
  POLYGON_ETH_CHAIN_ID,
} from 'views/components/CommunityInformationForm/constants';

export const communityBases = {
  Cosmos: ChainBase.CosmosSDK,
  Ethereum: ChainBase.Ethereum,
  Solana: ChainBase.Solana,
};

export const communityChains = {
  Base: parseInt(BASE_ID),
  Polygon: POLYGON_ETH_CHAIN_ID,
  Blast: parseInt(BLAST_ID),
};

export const communityTypes = Object.keys(CommunityType) as CommunityType[];

export const communitySortOptionsLabelToKeysMap = {
  'Most Recent': 'created_at',
  'Market Cap': '',
  Price: '',
  'Number of Members': 'profile_count',
  'Number of Threads': 'lifetime_thread_count',
};

export const sortOrderLabelsToDirectionsMap = {
  Ascending: 'ASC',
  Descending: 'DESC',
};

export const communityNetworks: string[] = Object.keys(ChainNetwork).filter(
  (val) => val === 'ERC20', // only allowing ERC20 for now
);

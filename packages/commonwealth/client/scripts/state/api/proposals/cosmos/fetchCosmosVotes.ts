import type { QueryVotesResponseSDKType } from '@hicommonwealth/chains';
import { ChainBase } from '@hicommonwealth/core';
import { useQuery } from '@tanstack/react-query';
import { CosmosProposalV1 } from 'controllers/chain/cosmos/gov/v1/proposal-v1';
import { CosmosProposal } from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import type { QueryVotesResponse } from 'cosmjs-types/cosmos/gov/v1beta1/query';
import _ from 'lodash';
import { AnyProposal } from 'models/types';
import app from 'state';

const VOTES_CACHE_TIME = 1000 * 60 * 60;
const VOTES_STALE_TIME = 1000 * 30;

const fetchCosmosVotes = async (
  proposal: AnyProposal,
): Promise<QueryVotesResponse | QueryVotesResponseSDKType> => {
  if (
    proposal instanceof CosmosProposalV1 ||
    proposal instanceof CosmosProposal
  ) {
    return proposal.fetchVotes();
  } else {
    return null;
  }
};

const getCosmosVotesQueryKey = (proposal: AnyProposal, poolParams: number) => {
  return [
    'cosmosVotes',
    app.activeChainId(),
    proposal?.identifier,
    proposal?.turnout,
    poolParams, // turnout depends on chain.staked set by poolParams
  ];
};

// TODO: depends on staked
const useCosmosProposalVotesQuery = (
  proposal: AnyProposal,
  poolParams: number,
) => {
  return useQuery({
    queryKey: getCosmosVotesQueryKey(proposal, poolParams),
    queryFn: () => fetchCosmosVotes(proposal),
    enabled:
      app.chain?.base === ChainBase.CosmosSDK &&
      !_.isEmpty(proposal) &&
      !proposal.completed,
    staleTime: VOTES_STALE_TIME,
    cacheTime: VOTES_CACHE_TIME,
  });
};

export { useCosmosProposalVotesQuery };

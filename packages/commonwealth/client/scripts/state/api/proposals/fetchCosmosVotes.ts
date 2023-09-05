import app from 'state';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import type { QueryVotesResponse } from 'cosmjs-types/cosmos/gov/v1beta1/query';
import type { QueryVotesResponseSDKType } from 'common-common/src/cosmos-ts/src/codegen/cosmos/gov/v1/query';
import { ChainBase } from 'common-common/src/types';
import { CosmosProposal } from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import { CosmosProposalV1 } from 'controllers/chain/cosmos/gov/v1/proposal-v1';
import { AnyProposal } from 'models/types';

const VOTES_CACHE_TIME = 1000 * 60 * 60;
const VOTES_STALE_TIME = 1000 * 30;

const fetchCosmosVotes = async (
  proposal: AnyProposal
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

const useCosmosVotes = (proposal: AnyProposal) => {
  const chainId = app.activeChainId();
  const proposalId = proposal?.identifier;
  const turnout = proposal?.turnout; // using this as a dependency in case proposal is refetched
  return useQuery({
    queryKey: ['votes', { chainId, proposalId, turnout, proposal }],
    queryFn: () => fetchCosmosVotes(proposal),
    enabled:
      app.chain?.base === ChainBase.CosmosSDK &&
      !_.isEmpty(proposal) &&
      !proposal.completed,
    staleTime: VOTES_STALE_TIME,
    cacheTime: VOTES_CACHE_TIME,
  });
};

export { useCosmosVotes };

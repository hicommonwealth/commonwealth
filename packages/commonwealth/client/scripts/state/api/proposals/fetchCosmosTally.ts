import app from 'state';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import type { QueryTallyResultResponse } from 'cosmjs-types/cosmos/gov/v1beta1/query';
import type { QueryTallyResultResponseSDKType } from 'common-common/src/cosmos-ts/src/codegen/cosmos/gov/v1/query';
import { ChainBase } from 'common-common/src/types';
import { CosmosProposal } from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import { CosmosProposalV1 } from 'controllers/chain/cosmos/gov/v1/proposal-v1';
import { AnyProposal } from 'models/types';

const TALLY_CACHE_TIME = 1000 * 60 * 60;
const TALLY_STALE_TIME = 1000 * 30;

const fetchCosmosTally = async (
  proposal: AnyProposal
): Promise<QueryTallyResultResponse | QueryTallyResultResponseSDKType> => {
  if (
    proposal instanceof CosmosProposalV1 ||
    proposal instanceof CosmosProposal
  ) {
    return proposal.fetchTally();
  } else {
    return null;
  }
};

const useCosmosTally = (proposal: AnyProposal) => {
  const chainId = app.activeChainId();
  const proposalId = proposal?.identifier;
  const support = proposal?.support; // using this as a dependency in case proposal is refetched
  return useQuery({
    queryKey: ['tally', chainId, proposalId, support],
    queryFn: () => fetchCosmosTally(proposal),
    enabled:
      app.chain?.base === ChainBase.CosmosSDK &&
      !_.isEmpty(proposal) &&
      !proposal.completed,
    staleTime: TALLY_STALE_TIME,
    cacheTime: TALLY_CACHE_TIME,
  });
};

export { useCosmosTally };

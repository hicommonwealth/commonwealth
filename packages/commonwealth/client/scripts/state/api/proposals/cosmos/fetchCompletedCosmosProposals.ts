import { ChainBase } from '@hicommonwealth/core';
import { useQuery } from '@tanstack/react-query';
import Cosmos from 'controllers/chain/cosmos/adapter';
import { getCompletedProposals } from 'controllers/chain/cosmos/gov/utils';
import { CosmosProposal } from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import app from 'state';

// completed proposals never change, so we can cache
// the old ones forever. React Query will load new
// ones in the background, and update if needed.
const COMPLETED_PROPOSALS_CACHE_TIME = Infinity;
// 15sec - don't need constant pinging here
const COMPLETED_PROPOSALS_STALE_TIME = 1000 * 15;

const fetchCompletedProposals = async (): Promise<CosmosProposal[]> => {
  return getCompletedProposals(app.chain as Cosmos);
};

interface CompletedProposalsProps {
  isApiReady?: boolean;
}

const useCompletedCosmosProposalsQuery = ({
  isApiReady,
}: CompletedProposalsProps) => {
  const communityId = app.activeChainId();
  return useQuery({
    queryKey: ['completedProposals', communityId],
    queryFn: fetchCompletedProposals,
    enabled: app.chain?.base === ChainBase.CosmosSDK && isApiReady,
    retry: 3,
    cacheTime: COMPLETED_PROPOSALS_CACHE_TIME,
    staleTime: COMPLETED_PROPOSALS_STALE_TIME,
  });
};

export { useCompletedCosmosProposalsQuery };

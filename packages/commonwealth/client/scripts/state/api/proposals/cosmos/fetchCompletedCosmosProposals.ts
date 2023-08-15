import app from 'state';
import { useQuery } from '@tanstack/react-query';
import Cosmos from 'controllers/chain/cosmos/adapter';
import { getCompletedProposals } from 'controllers/chain/cosmos/gov/utils';

const fetchCompletedProposals = async () => {
  return getCompletedProposals(app.chain as Cosmos);
};

interface CompletedProposalsProps {
  isApiReady?: boolean;
}

const useCompletedCosmosProposalsQuery = ({
  isApiReady,
}: CompletedProposalsProps) => {
  const cosmosChain = app.chain as Cosmos;
  return useQuery({
    queryKey: ['completedProposals', { chain: app.activeChainId() }],
    queryFn: fetchCompletedProposals,
    enabled: isApiReady,
    retry: 3,
    // completed proposals never change, so we can cache
    // the old ones forever. React Query will load new
    // ones in the background.
    cacheTime: Infinity,
  });
};

export { useCompletedCosmosProposalsQuery };

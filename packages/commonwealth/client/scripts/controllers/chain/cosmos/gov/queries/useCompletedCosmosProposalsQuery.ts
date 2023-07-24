import app from 'state';
import { useQuery } from '@tanstack/react-query';
import Cosmos from 'controllers/chain/cosmos/adapter';
import { getCompletedProposals } from '../utils';

interface CompletedProposalsProps {
  isApiReady?: boolean;
}

const useCompletedCosmosProposalsQuery = ({
  isApiReady,
}: CompletedProposalsProps) => {
  const cosmosChain = app.chain as Cosmos;
  return useQuery({
    /* eslint-disable @tanstack/query/exhaustive-deps*/
    queryKey: ['completedProposals', cosmosChain.id],
    queryFn: () => getCompletedProposals(cosmosChain),
    enabled: isApiReady,
    retry: 3, // these can be problematic, so we retry
    // completed proposals never change, so we can cache
    // the old ones forever. React Query will load new
    // ones in the background.
    cacheTime: Infinity,
  });
};

export { useCompletedCosmosProposalsQuery };

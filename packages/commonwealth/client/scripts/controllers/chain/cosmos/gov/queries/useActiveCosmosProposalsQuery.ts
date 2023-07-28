import app from 'state';
import { useQuery } from '@tanstack/react-query';
import Cosmos from 'controllers/chain/cosmos/adapter';
import { getActiveProposals } from '../utils';

interface ActiveProposalsProps {
  isApiReady?: boolean;
}

const useActiveCosmosProposalsQuery = ({
  isApiReady,
}: ActiveProposalsProps) => {
  const cosmosChain = app.chain as Cosmos;
  return useQuery({
    /* eslint-disable @tanstack/query/exhaustive-deps*/
    queryKey: ['activeProposals', cosmosChain.id],
    queryFn: () => getActiveProposals(cosmosChain),
    enabled: isApiReady,
    retry: 5, // these can be problematic, so we retry
  });
};

export { useActiveCosmosProposalsQuery };

import app from 'state';
import { useQuery } from '@tanstack/react-query';
import Cosmos from 'controllers/chain/cosmos/adapter';
import { getActiveProposals } from 'controllers/chain/cosmos/gov/utils';

const fetchActiveProposals = async () => {
  return getActiveProposals(app.chain as Cosmos);
};

interface ActiveProposalsProps {
  isApiReady?: boolean;
}

const useActiveCosmosProposalsQuery = ({
  isApiReady,
}: ActiveProposalsProps) => {
  return useQuery({
    queryKey: ['activeProposals', { chain: app.activeChainId() }],
    queryFn: fetchActiveProposals,
    enabled: isApiReady,
    retry: 5, // these can be problematic, so we retry
  });
};

export { useActiveCosmosProposalsQuery };

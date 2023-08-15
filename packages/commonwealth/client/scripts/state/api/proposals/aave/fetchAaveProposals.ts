import AaveGovernance from 'controllers/chain/ethereum/aave/governance';
import Aave from 'controllers/chain/ethereum/aave/adapter';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';
import { useQuery } from '@tanstack/react-query';

const PROPOSAL_STALE_TIME = 30000; // 30 seconds

const fetchAaveProposals = async () => {
  AaveGovernance.getProposals(app.chain as Aave);
  return [];
};

const useAaveProposalsQuery = ({
  moduleReady,
  chainId,
}: {
  moduleReady: boolean;
  chainId: string;
}) => {
  return useQuery({
    queryKey: [ApiEndpoints.FETCH_PROPOSALS, chainId],
    queryFn: fetchAaveProposals,
    enabled: moduleReady,
    cacheTime: PROPOSAL_STALE_TIME,
  });
};

export default useAaveProposalsQuery;

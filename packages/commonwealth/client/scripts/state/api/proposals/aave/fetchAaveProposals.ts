import { useQuery } from '@tanstack/react-query';
import Aave from 'controllers/chain/ethereum/aave/adapter';
import AaveGovernance from 'controllers/chain/ethereum/aave/governance';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';

const PROPOSAL_STALE_TIME = 30000; // 30 seconds

const fetchAaveProposals = async () => {
  return AaveGovernance.getProposals(app.chain as Aave);
};

const useAaveProposalsQuery = ({
  moduleReady,
  communityId,
}: {
  moduleReady: boolean;
  communityId: string;
}) => {
  return useQuery({
    queryKey: [ApiEndpoints.FETCH_PROPOSALS, communityId],
    queryFn: fetchAaveProposals,
    enabled: moduleReady,
    staleTime: PROPOSAL_STALE_TIME,
  });
};

export default useAaveProposalsQuery;

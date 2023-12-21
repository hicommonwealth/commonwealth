import { useQuery } from '@tanstack/react-query';
import Compound from 'controllers/chain/ethereum/compound/adapter';
import CompoundGovernance from 'controllers/chain/ethereum/compound/governance';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';

const PROPOSAL_STALE_TIME = 30000; // 30 seconds

const fetchCompoundProposals = async () => {
  return CompoundGovernance.getProposals(app.chain as Compound);
};

const useCompoundProposalsQuery = ({
  moduleReady,
  communityId,
}: {
  moduleReady: boolean;
  communityId: string;
}) => {
  return useQuery({
    queryKey: [ApiEndpoints.FETCH_PROPOSALS, communityId],
    queryFn: fetchCompoundProposals,
    enabled: moduleReady,
    staleTime: PROPOSAL_STALE_TIME,
  });
};

export default useCompoundProposalsQuery;

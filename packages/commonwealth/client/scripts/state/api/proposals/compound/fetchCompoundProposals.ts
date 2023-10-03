import CompoundGovernance from 'controllers/chain/ethereum/compound/governance';
import Compound from 'controllers/chain/ethereum/compound/adapter';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';
import { useQuery } from '@tanstack/react-query';

const PROPOSAL_STALE_TIME = 30000; // 30 seconds

const fetchCompoundProposals = async () => {
  return CompoundGovernance.getProposals(app.chain as Compound);
};

const useCompoundProposalsQuery = ({
  moduleReady,
  chainId,
}: {
  moduleReady: boolean;
  chainId: string;
}) => {
  return useQuery({
    queryKey: [ApiEndpoints.FETCH_PROPOSALS, chainId],
    queryFn: fetchCompoundProposals,
    enabled: moduleReady,
    staleTime: PROPOSAL_STALE_TIME,
  });
};

export default useCompoundProposalsQuery;

import Aave from 'controllers/chain/ethereum/aave/adapter';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';
import { useQuery } from '@tanstack/react-query';
import AaveProposal from 'controllers/chain/ethereum/aave/proposal';

const VOTE_STALE_TIME = 30000; // 30 seconds

const fetchAaveProposalVotes = async (proposalId: string) => {
  return AaveProposal.fetchVotes(+proposalId, app.chain as Aave);
};

const useAaveProposalVotesQuery = ({
  moduleReady,
  chainId,
  proposalId,
}: {
  moduleReady: boolean;
  chainId: string;
  proposalId: string;
}) => {
  return useQuery({
    queryKey: [ApiEndpoints.FETCH_PROPOSAL_VOTES, chainId, proposalId],
    queryFn: () => fetchAaveProposalVotes(proposalId),
    enabled: moduleReady,
    staleTime: VOTE_STALE_TIME,
  });
};

export default useAaveProposalVotesQuery;

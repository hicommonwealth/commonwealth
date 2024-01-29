import { useQuery } from '@tanstack/react-query';
import Aave from 'controllers/chain/ethereum/aave/adapter';
import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';

const VOTE_STALE_TIME = 30000; // 30 seconds

const fetchAaveProposalVotes = async (proposalId: string) => {
  return AaveProposal.fetchVotes(+proposalId, app.chain as Aave);
};

const useAaveProposalVotesQuery = ({
  moduleReady,
  communityId,
  proposalId,
}: {
  moduleReady: boolean;
  communityId: string;
  proposalId: string;
}) => {
  return useQuery({
    queryKey: [ApiEndpoints.FETCH_PROPOSAL_VOTES, communityId, proposalId],
    queryFn: () => fetchAaveProposalVotes(proposalId),
    enabled: moduleReady,
    staleTime: VOTE_STALE_TIME,
  });
};

export default useAaveProposalVotesQuery;

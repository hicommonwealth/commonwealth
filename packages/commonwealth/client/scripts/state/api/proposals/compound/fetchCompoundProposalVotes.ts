import Compound from 'controllers/chain/ethereum/compound/adapter';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';
import { useQuery } from '@tanstack/react-query';
import CompoundProposal from 'controllers/chain/ethereum/compound/proposal';

const VOTE_STALE_TIME = 30000; // 30 seconds

const fetchCompoundProposalVotes = async (proposalId: string) => {
  return CompoundProposal.fetchVotes(proposalId, app.chain as Compound);
};

const useCompoundProposalVotesQuery = ({
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
    queryFn: () => fetchCompoundProposalVotes(proposalId),
    enabled: moduleReady,
    staleTime: VOTE_STALE_TIME,
  });
};

export default useCompoundProposalVotesQuery;

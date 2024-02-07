import { useQuery } from '@tanstack/react-query';
import Compound from 'controllers/chain/ethereum/compound/adapter';
import CompoundProposal from 'controllers/chain/ethereum/compound/proposal';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';

const VOTE_STALE_TIME = 30000; // 30 seconds

const fetchCompoundProposalVotes = async (
  proposalId: string,
  proposalIdentifier: string,
) => {
  return CompoundProposal.fetchVotes(
    proposalId,
    proposalIdentifier,
    app.chain as Compound,
  );
};

const useCompoundProposalVotesQuery = ({
  moduleReady,
  communityId,
  proposalId,
  proposalIdentifier,
}: {
  moduleReady: boolean;
  communityId: string;
  proposalId: string;
  proposalIdentifier: string;
}) => {
  return useQuery({
    queryKey: [
      ApiEndpoints.FETCH_PROPOSAL_VOTES,
      communityId,
      proposalId,
      proposalIdentifier,
    ],
    queryFn: () => fetchCompoundProposalVotes(proposalId, proposalIdentifier),
    enabled: moduleReady,
    staleTime: VOTE_STALE_TIME,
  });
};

export default useCompoundProposalVotesQuery;

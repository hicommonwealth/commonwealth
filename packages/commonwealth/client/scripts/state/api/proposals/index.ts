import { useActiveCosmosProposalsQuery } from './cosmos/fetchActiveCosmosProposals';
import { useCompletedCosmosProposalsQuery } from './cosmos/fetchCompletedCosmosProposals';
import useAaveProposalsQuery from 'state/api/proposals/aave/fetchAaveProposals';
import useAaveProposalVotesQuery from 'state/api/proposals/aave/fetchAaveProposalVotes';
import useCompoundProposalsQuery from 'state/api/proposals/compound/fetchCompoundProposals';

export {
  useActiveCosmosProposalsQuery,
  useCompletedCosmosProposalsQuery,
  useAaveProposalVotesQuery,
  useAaveProposalsQuery,
  useCompoundProposalsQuery,
};

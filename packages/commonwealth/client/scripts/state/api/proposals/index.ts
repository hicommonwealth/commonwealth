import { useActiveCosmosProposalsQuery } from './cosmos/fetchActiveCosmosProposals';
import { useCompletedCosmosProposalsQuery } from './cosmos/fetchCompletedCosmosProposals';
import { useCosmosProposalMetadataQuery } from './cosmos/fetchCosmosProposalMetadata';
import { useCosmosProposal } from './cosmos/fetchCosmosProposal';
import { useCosmosTally } from './cosmos/fetchCosmosTally';
import { useCosmosVotes } from './cosmos/fetchCosmosVotes';
import { useCosmosDeposits } from './cosmos/fetchCosmosDeposits';
import useAaveProposalsQuery from 'state/api/proposals/aave/fetchAaveProposals';
import useAaveProposalVotesQuery from 'state/api/proposals/aave/fetchAaveProposalVotes';
import useCompoundProposalsQuery from 'state/api/proposals/compound/fetchCompoundProposals';
import useCompoundProposalVotesQuery from 'state/api/proposals/compound/fetchCompoundProposalVotes';

export {
  useActiveCosmosProposalsQuery,
  useCompletedCosmosProposalsQuery,
  useCosmosProposalMetadataQuery,
  useCosmosProposal,
  useCosmosTally,
  useCosmosVotes,
  useCosmosDeposits,
  useAaveProposalVotesQuery,
  useAaveProposalsQuery,
  useCompoundProposalsQuery,
  useCompoundProposalVotesQuery,
};

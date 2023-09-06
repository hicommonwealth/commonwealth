import { useActiveCosmosProposalsQuery } from './cosmos/fetchActiveCosmosProposals';
import { useCompletedCosmosProposalsQuery } from './cosmos/fetchCompletedCosmosProposals';
import { useCosmosProposalMetadataQuery } from './fetchCosmosProposalMetadata';
import { useCosmosProposal } from './fetchCosmosProposal';
import { useCosmosTally } from './fetchCosmosTally';
import { useCosmosVotes } from './fetchCosmosVotes';
import { useCosmosDeposits } from './fetchCosmosDeposits';
import useAaveProposalsQuery from 'state/api/proposals/aave/fetchAaveProposals';
import useAaveProposalVotesQuery from 'state/api/proposals/aave/fetchAaveProposalVotes';


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
};

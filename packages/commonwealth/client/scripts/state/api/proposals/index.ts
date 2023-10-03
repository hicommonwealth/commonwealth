import { useActiveCosmosProposalsQuery } from './cosmos/fetchActiveCosmosProposals';
import { useCompletedCosmosProposalsQuery } from './cosmos/fetchCompletedCosmosProposals';
import { useCosmosProposalMetadataQuery } from './cosmos/fetchCosmosProposalMetadata';
import { useCosmosProposalQuery } from './cosmos/fetchCosmosProposal';
import { useCosmosProposalTallyQuery } from './cosmos/fetchCosmosTally';
import { useCosmosProposalVotesQuery } from './cosmos/fetchCosmosVotes';
import { useCosmosProposalDepositsQuery } from './cosmos/fetchCosmosDeposits';
import useAaveProposalsQuery from 'state/api/proposals/aave/fetchAaveProposals';
import useAaveProposalVotesQuery from 'state/api/proposals/aave/fetchAaveProposalVotes';
import useRawAaveProposalsQuery from 'state/api/proposals/aave/fetchRawAaveProposals';
import useCompoundProposalsQuery from 'state/api/proposals/compound/fetchCompoundProposals';
import useCompoundProposalVotesQuery from 'state/api/proposals/compound/fetchCompoundProposalVotes';

export {
  useActiveCosmosProposalsQuery,
  useCompletedCosmosProposalsQuery,
  useCosmosProposalMetadataQuery,
  useCosmosProposalQuery,
  useCosmosProposalTallyQuery,
  useCosmosProposalVotesQuery,
  useCosmosProposalDepositsQuery,
  useAaveProposalVotesQuery,
  useAaveProposalsQuery,
  useRawAaveProposalsQuery,
  useCompoundProposalsQuery,
  useCompoundProposalVotesQuery,
};

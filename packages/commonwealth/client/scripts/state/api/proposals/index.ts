import useAaveProposalVotesQuery from 'state/api/proposals/aave/fetchAaveProposalVotes';
import useAaveProposalsQuery from 'state/api/proposals/aave/fetchAaveProposals';
import useCompoundProposalVotesQuery from 'state/api/proposals/compound/fetchCompoundProposalVotes';
import useCompoundProposalsQuery from 'state/api/proposals/compound/fetchCompoundProposals';
import useRawEvmProposalsQuery from 'state/api/proposals/fetchRawEvmProposals';
import { useActiveCosmosProposalsQuery } from './cosmos/fetchActiveCosmosProposals';
import { useCompletedCosmosProposalsQuery } from './cosmos/fetchCompletedCosmosProposals';
import { useCosmosProposalDepositsQuery } from './cosmos/fetchCosmosDeposits';
import { useCosmosProposalQuery } from './cosmos/fetchCosmosProposal';
import { useCosmosProposalMetadataQuery } from './cosmos/fetchCosmosProposalMetadata';
import { useCosmosProposalTallyQuery } from './cosmos/fetchCosmosTally';
import { useCosmosProposalVotesQuery } from './cosmos/fetchCosmosVotes';

export {
  useAaveProposalVotesQuery,
  useAaveProposalsQuery,
  useActiveCosmosProposalsQuery,
  useCompletedCosmosProposalsQuery,
  useCompoundProposalVotesQuery,
  useCompoundProposalsQuery,
  useCosmosProposalDepositsQuery,
  useCosmosProposalMetadataQuery,
  useCosmosProposalQuery,
  useCosmosProposalTallyQuery,
  useCosmosProposalVotesQuery,
  useRawEvmProposalsQuery,
};

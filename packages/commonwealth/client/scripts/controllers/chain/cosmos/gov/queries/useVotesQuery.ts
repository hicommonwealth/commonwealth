import app from 'state';
import { useQuery } from '@tanstack/react-query';
import Cosmos from 'controllers/chain/cosmos/adapter';
import { ApiReadyProps } from './types';
import { CosmosProposal } from '../v1beta1/proposal-v1beta1';
import { CosmosProposalV1 } from '../v1/proposal-v1';

interface Props extends ApiReadyProps {
  proposal: CosmosProposal | CosmosProposalV1;
}

const useVotesQuery = ({ isApiReady, proposal }: Props) => {
  const cosmosChain = app.chain as Cosmos;
  return useQuery({
    queryKey: [
      'votes',
      { chainId: cosmosChain?.id, proposalId: proposal?.identifier },
    ],
    queryFn: () => proposal.fetchVoteInfo(),
    enabled: isApiReady && !!proposal && !proposal.completed, // TODO: is there a better way to avoid completed proposals cluttering up RQ? Maybe wrap in a hook?
  });
};

export { useVotesQuery }; //TODO: setState in UI instead of waiting for controller

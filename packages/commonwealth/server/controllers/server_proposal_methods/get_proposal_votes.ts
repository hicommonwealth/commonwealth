import {
  ServerProposalsController,
  SupportedProposalNetworks,
} from '../server_proposals_controller';
import { providers } from 'ethers';
import { ChainNetwork } from 'common-common/src/types';
import { formatAaveProposalVote, getAaveProposalVotes } from './aave/votes';
import { ServerError } from 'near-api-js/lib/utils/rpc_errors';
import { IAaveVoteResponse } from 'adapters/chain/aave/types';

export type GetProposalVotesOptions = {
  chainId: string;
  proposalId: number;
};

export type GetProposalVotesResult = any[];

export async function __getProposalVotes(
  this: ServerProposalsController,
  { chainId, proposalId }: GetProposalVotesOptions,
  provider: providers.Web3Provider,
  contractInfo: { address: string; type: SupportedProposalNetworks }
): Promise<GetProposalVotesResult> {
  let votes: IAaveVoteResponse[] = [];
  if (contractInfo.type === ChainNetwork.Aave) {
    const votesArgs = await getAaveProposalVotes(
      contractInfo.address,
      provider,
      proposalId
    );
    votes = votesArgs.map((vote) => formatAaveProposalVote(vote));
  } else if (contractInfo.type === ChainNetwork.Compound) {
    // compound vote fetching
  } else {
    throw new ServerError(
      `Proposal fetching not supported for chain ${chainId} on network ${contractInfo.type}`
    );
  }

  return votes;
}

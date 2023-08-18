import {
  ContractInfo,
  ServerProposalsController,
} from '../server_proposals_controller';
import { providers } from 'ethers';
import { ChainNetwork } from 'common-common/src/types';
import { formatAaveProposalVote, getAaveProposalVotes } from './aave/votes';
import { ServerError } from 'near-api-js/lib/utils/rpc_errors';
import { IAaveVoteResponse } from 'adapters/chain/aave/types';
import {
  formatCompoundProposalVote,
  getCompoundProposalVotes,
} from './compound/votes';
import { ICompoundVoteResponse } from 'adapters/chain/compound/types';

export type GetProposalVotesOptions = {
  chainId: string;
  proposalId: string;
};

export type GetProposalVotesResult =
  | IAaveVoteResponse[]
  | ICompoundVoteResponse[];

export async function __getProposalVotes(
  this: ServerProposalsController,
  { chainId, proposalId }: GetProposalVotesOptions,
  provider: providers.Web3Provider,
  contractInfo: ContractInfo
): Promise<GetProposalVotesResult> {
  let votes: IAaveVoteResponse[] | ICompoundVoteResponse[] = [];
  if (contractInfo.type === ChainNetwork.Aave) {
    const votesArgs = await getAaveProposalVotes(
      contractInfo.address,
      provider,
      +proposalId
    );
    votes = votesArgs.map((vote) => formatAaveProposalVote(vote));
  } else if (contractInfo.type === ChainNetwork.Compound) {
    const votesArgs = await getCompoundProposalVotes(
      contractInfo.govVersion,
      contractInfo.address,
      provider,
      proposalId.toString()
    );
    votes = votesArgs.map((vote) => formatCompoundProposalVote(vote));
  } else {
    throw new ServerError(
      `Proposal fetching not supported for chain ${chainId} on network ${contractInfo.type}`
    );
  }

  return votes;
}

import { ChainNetwork } from '@hicommonwealth/core';
import { providers } from 'ethers';
import { ServerError } from 'near-api-js/lib/utils/rpc_errors';
import { IAaveVoteResponse } from '../../../shared/adapters/chain/aave/types';
import { ICompoundVoteResponse } from '../../../shared/adapters/chain/compound/types';
import {
  ContractInfo,
  ServerProposalsController,
} from '../server_proposals_controller';
import { formatAaveProposalVote, getAaveProposalVotes } from './aave/votes';
import {
  formatCompoundProposalVote,
  getCompoundProposalVotes,
} from './compound/votes';

export type GetProposalVotesOptions = {
  communityId: string;
  proposalId: string;
};

export type GetProposalVotesResult =
  | IAaveVoteResponse[]
  | ICompoundVoteResponse[];

export async function __getProposalVotes(
  this: ServerProposalsController,
  { communityId, proposalId }: GetProposalVotesOptions,
  provider: providers.Web3Provider,
  contractInfo: ContractInfo,
): Promise<GetProposalVotesResult> {
  let votes: IAaveVoteResponse[] | ICompoundVoteResponse[] = [];
  if (contractInfo.type === ChainNetwork.Aave) {
    const votesArgs = await getAaveProposalVotes(
      contractInfo.address,
      provider,
      +proposalId,
    );
    votes = votesArgs.map((vote) => formatAaveProposalVote(vote));
  } else if (contractInfo.type === ChainNetwork.Compound) {
    const votesArgs = await getCompoundProposalVotes(
      contractInfo.address,
      provider,
      proposalId,
    );
    votes = votesArgs.map((vote) => formatCompoundProposalVote(vote));
  } else {
    throw new ServerError(
      `Proposal fetching not supported for community ${communityId} on network ${contractInfo.type}`,
    );
  }

  return votes;
}

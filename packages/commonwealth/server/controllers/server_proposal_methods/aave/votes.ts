import { IAaveGovernanceV2__factory } from '@hicommonwealth/chains';
import { IAaveVoteResponse } from 'adapters/chain/aave/types';
import { BigNumber, providers } from 'ethers';

type VoteEventArgsArray = [BigNumber, string, boolean, BigNumber];
type VoteEventArgsObject = {
  id: BigNumber;
  voter: string;
  support: boolean;
  votingPower: BigNumber;
};

export function formatAaveProposalVote(
  vote: VoteEventArgsObject,
): IAaveVoteResponse {
  const aaveResponse: IAaveVoteResponse = {
    id: +vote.id,
    voter: vote.voter,
    support: vote.support,
    votingPower: vote.votingPower.toString(),
  };

  return aaveResponse;
}

export async function getAaveProposalVotes(
  aaveGovAddress: string,
  provider: providers.Web3Provider,
  proposalId: number,
): Promise<VoteEventArgsObject[]> {
  const govContract = IAaveGovernanceV2__factory.connect(
    aaveGovAddress,
    provider,
  );
  await govContract.deployed();

  const proposal = await govContract.getProposalById(proposalId);
  const voteEvents = await govContract.queryFilter<
    VoteEventArgsArray,
    VoteEventArgsObject
  >(
    govContract.filters.VoteEmitted(null, null, null, null),
    proposal.startBlock.toNumber(),
    proposal.endBlock.toNumber(),
  );

  const voteArgs: VoteEventArgsObject[] = [];
  for (const event of voteEvents) {
    if (event.args.id.toNumber() === proposalId) voteArgs.push(event.args);
  }

  return voteArgs;
}

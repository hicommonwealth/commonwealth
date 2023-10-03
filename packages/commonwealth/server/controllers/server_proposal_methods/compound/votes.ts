import { BigNumber, providers } from 'ethers';
import { getCompoundGovContractAndVersion } from './compoundVersion';
import { CompoundVoteEvents, GovVersion } from './types';
import {
  GovernorAlpha,
  GovernorBravoDelegate,
  GovernorCompatibilityBravo,
} from 'common-common/src/eth/types';
import { ICompoundVoteResponse } from 'adapters/chain/compound/types';
import { RedisCache } from 'common-common/src/redisCache';

export function formatCompoundProposalVote(
  vote: CompoundVoteEvents
): ICompoundVoteResponse {
  return {
    voter: vote.voter,
    id: vote.proposalId.toString(),
    support: +vote.support,
    votes: vote.votes.toString(),
    reason: vote.reason,
  };
}

export async function getCompoundProposalVotes(
  compoundGovAddress: string,
  provider: providers.Web3Provider,
  proposalId: string,
  redisCache: RedisCache
): Promise<CompoundVoteEvents[]> {
  const { contract, version: govVersion } =
    await getCompoundGovContractAndVersion(
      redisCache,
      compoundGovAddress,
      provider
    );

  let events;
  if (govVersion === GovVersion.Alpha) {
    const typedContract = <GovernorAlpha>contract;
    const proposal = await typedContract.proposals(proposalId);
    events = await typedContract.queryFilter(
      typedContract.filters.VoteCast(null, null, null, null),
      +proposal.startBlock,
      +proposal.endBlock
    );
    events = events.map((e) => {
      return {
        voter: e.args[0],
        proposalId: e.args[1],
        support: e.args[2],
        votes: e.args[3],
      };
    });
  } else if (govVersion === GovVersion.Bravo) {
    const typedContract = <GovernorBravoDelegate>contract;
    const proposal = await typedContract.proposals(proposalId);
    events = await typedContract.queryFilter(
      typedContract.filters.VoteCast(null, null, null, null, null),
      +proposal.startBlock,
      +proposal.endBlock
    );
    events = events.map((e) => {
      return {
        voter: e.args[0],
        proposalId: e.args[1],
        support: e.args[2],
        votes: e.args[3],
        reason: e.args[4],
      };
    });
  } else {
    const typedContract = <GovernorCompatibilityBravo>contract;
    const proposal = await typedContract.proposals(BigNumber.from(proposalId));
    events = await typedContract.queryFilter(
      typedContract.filters.VoteCast(null, null, null, null, null),
      +proposal.startBlock,
      +proposal.endBlock
    );
    events = events.map((e) => {
      return {
        voter: e.args[0],
        proposalId: e.args[1],
        support: e.args[2],
        votes: e.args[3],
        reason: e.args[4],
      };
    });
  }

  return events;
}

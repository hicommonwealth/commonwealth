import {
  Proposal,
  Client as SnapshotClient,
  Vote,
  VoteClasses,
  getBlockNumber,
  getProvider,
  utils,
} from '@timolegros/snapshot.js';
import { notifyError } from 'controllers/app/notifications';
import { ExternalEndpoints, queryClient } from 'state/api/config';
import {
  getSnapshotProposalsQuery,
  getSnapshotSpaceQuery,
} from 'state/api/snapshots';
import { getSnapshotVotesQuery } from 'state/api/snapshots/getVotes';

export interface SnapshotSpace {
  id: string;
  name: string;
  about: string;
  symbol: string;
  private: boolean;
  network: string;
  avatar: string;
  validation: {
    params: {
      minScore: number;
    };
  };
  voting: {
    period: number;
    delay: number;
  };
  filters: {
    minScore: number;
    onlyMembers: boolean;
  };
  strategies: Array<{
    name: string;
    network?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params: any;
  }>;
  members: string[];
}

export interface SnapshotProposal {
  id: string;
  ipfs: string;
  author: string;
  created: number;
  type: string;
  start: number;
  end: number;
  title: string;
  body: string;
  snapshot: string;
  choices: string[];
  state: string;
  scores: number[];
  scores_total: number;
  strategies?: Array<{
    name: string;
    network?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params: any;
  }>;
}

export type SnapshotProposalVote = {
  id: string;
  voter: string;
  created: number;
  choice: number;
  balance: number;
};

const client = new SnapshotClient('https://hub.snapshot.org');

export async function castVote(
  address: string,
  payload: Vote,
  spaceId: string,
) {
  const { Web3Provider } = await import('@ethersproject/providers');
  const web3 = new Web3Provider((window as any).ethereum);
  await client.vote(web3 as any, address, payload);
  await queryClient.invalidateQueries({
    queryKey: [ExternalEndpoints.snapshotHub.url, 'proposals', spaceId],
  });
}

export async function createProposal(
  address: string,
  payload: Proposal,
  spaceId: string,
) {
  const { Web3Provider } = await import('@ethersproject/providers');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const web3 = new Web3Provider((window as any).ethereum);

  const res = await client.proposal(web3, address, payload);

  await queryClient.invalidateQueries({
    queryKey: [ExternalEndpoints.snapshotHub.url, 'proposals', spaceId],
  });

  return res;
}

export async function getSpaceBlockNumber(network: string): Promise<number> {
  return getBlockNumber(getProvider(network));
}

export async function getScore(
  space: SnapshotSpace,
  address: string,
): Promise<Array<{ [index: string]: number }>> {
  return utils.getScores(
    space?.id,
    space?.strategies,
    space?.network,
    [address],
    // Snapshot.utils.getProvider(space.network),
  );
}

export type VoteResultsData = {
  resultsByVoteBalance: number[][];
  resultsByStrategyScore: number[];
  sumOfResultsBalance: number;
};

export type VoteResults = {
  votes: SnapshotProposalVote[];
  results: VoteResultsData;
};

/* Single Choice Voting */

export async function getResults(
  space: SnapshotSpace,
  proposal: SnapshotProposal,
): Promise<VoteResults> {
  try {
    let votes = await getSnapshotVotesQuery({ proposalId: proposal.id });

    const strategies = proposal.strategies ?? space.strategies;

    if (proposal.state !== 'pending') {
      let attempts = 0;
      while (attempts <= 3) {
        try {
          const scores = await utils.getScores(
            space?.id,
            strategies,
            space?.network,
            votes.map((vote) => vote.voter),
            parseInt(proposal.snapshot, 10),
            // provider,
          );
          votes = votes
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((vote: any) => {
              vote.scores = strategies.map(
                (strategy, i) => scores[i][vote.voter] || 0,
              );
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              vote.balance = vote.scores.reduce((a, b: any) => a + b, 0);
              return vote;
            })
            .sort((a, b) => b.balance - a.balance)
            .filter((vote) => vote.balance > 0);
          break;
        } catch (e) {
          if (attempts === 3) {
            console.log(e);
            notifyError('Snapshot.js API failed to return the results.');
          }
        } finally {
          attempts += 1;
        }
      }
    }

    /* Get results */
    const votingClass = VoteClasses[proposal.type](proposal, votes, strategies);
    const results = {
      resultsByVoteBalance: votingClass.getScores(),
      resultsByStrategyScore: votingClass.getScoresByStrategy(),
      sumOfResultsBalance: votingClass.getScoresTotal(),
    };

    return { votes, results } as VoteResults;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

export type Power = {
  scores: number[];
  totalScore: number;
};

export async function getPower(
  space: SnapshotSpace,
  proposal: SnapshotProposal,
  address: string,
): Promise<Power> {
  const blockNumber = await getBlockNumber(getProvider(space.network));
  const blockTag =
    +proposal.snapshot > blockNumber ? 'latest' : +proposal.snapshot;
  const scores: Array<{ [who: string]: number }> = await utils.getScores(
    space?.id,
    proposal?.strategies!,
    space?.network,
    [address],
    blockTag,
    // Snapshot.utils.getProvider(space.network),
  );
  const summedScores = scores.map((score) =>
    Object.values(score).reduce((a, b) => a + b, 0),
  );
  return {
    scores: summedScores,
    totalScore: summedScores.reduce((a, b) => a + b, 0),
  };
}

export async function loadMultipleSpacesData(snapshot_spaces: string[]) {
  const spacesData: Array<{
    space: SnapshotSpace;
    proposals: SnapshotProposal[];
  }> = [];

  for (const spaceId of snapshot_spaces) {
    let cleanSpaceId = spaceId;
    // Extract space if currently saved as a link
    if (spaceId.lastIndexOf('/') > -1) {
      cleanSpaceId = spaceId.slice(spaceId.lastIndexOf('/') + 1).trim();
    }
    try {
      const proposals = await getSnapshotProposalsQuery({
        space: cleanSpaceId,
      });

      const space = await getSnapshotSpaceQuery({ space: cleanSpaceId });
      spacesData.push({ space, proposals });
    } catch (e) {
      console.error(`Failed to initialize snapshot: ${cleanSpaceId}.`);
    }
  }

  return spacesData;
}

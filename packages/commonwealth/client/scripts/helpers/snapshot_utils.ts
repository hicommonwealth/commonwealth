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

class SnapshotLazyLoader {
  private static snapshot;
  private static client;

  private static async init() {
    if (!this.snapshot) {
      const module = await import('@snapshot-labs/snapshot.js');
      const hub = 'https://hub.snapshot.org'; // or https://testnet.snapshot.org for testnet
      this.client = new module.default.Client712(hub);
      this.snapshot = module.default;
    }
  }

  public static async getSnapshot() {
    await this.init();
    return this.snapshot;
  }

  public static async getClient() {
    await this.init();
    return this.client;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function castVote(address: string, payload: any, spaceId: string) {
  const { Web3Provider } = await import('@ethersproject/providers');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const web3 = new Web3Provider((window as any).ethereum);
  const client = await SnapshotLazyLoader.getClient();
  await client.vote(web3 as any, address, payload);
  await queryClient.invalidateQueries({
    queryKey: [ExternalEndpoints.snapshotHub.url, 'proposals', spaceId],
  });
}

export async function createProposal(
  address: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any,
  spaceId: string,
) {
  const { Web3Provider } = await import('@ethersproject/providers');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const web3 = new Web3Provider((window as any).ethereum);
  const client = await SnapshotLazyLoader.getClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = await client.proposal(web3 as any, address, payload);

  await queryClient.invalidateQueries({
    queryKey: [ExternalEndpoints.snapshotHub.url, 'proposals', spaceId],
  });

  return res;
}

export async function getSpaceBlockNumber(network: string): Promise<number> {
  const snapshot = await SnapshotLazyLoader.getSnapshot();
  return snapshot.utils.getBlockNumber(snapshot.utils.getProvider(network));
}

export async function getScore(
  space: SnapshotSpace,
  address: string,
): Promise<Array<{ [index: string]: number }>> {
  const snapshot = await SnapshotLazyLoader.getSnapshot();
  return snapshot.utils.getScores(
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
          const snapshot = await SnapshotLazyLoader.getSnapshot();
          const scores = await snapshot?.utils?.getScores(
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
    const snapshot = await SnapshotLazyLoader.getSnapshot();
    const votingClass = new snapshot.utils.voting[proposal.type](
      proposal,
      votes,
      strategies,
    );
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
  const snapshot = await SnapshotLazyLoader.getSnapshot();
  const blockNumber = await snapshot.utils.getBlockNumber(
    snapshot.utils.getProvider(space.network),
  );
  const blockTag =
    +proposal.snapshot > blockNumber ? 'latest' : +proposal.snapshot;
  const scores: Array<{ [who: string]: number }> =
    await snapshot.utils.getScores(
      space?.id,
      proposal?.strategies,
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

import { notifyError } from '../controllers/app/notifications';

let apolloClient = null;

class SnapshotLazyLoader {
  private static snapshot;
  private static client;

  private static async init() {
    if (!this.snapshot) {
      this.snapshot = await import('@snapshot-labs/snapshot.js');
      const hub = 'https://hub.snapshot.org'; // or https://testnet.snapshot.org for testnet
      this.client = new this.snapshot.Client712(hub);
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

// Queries from: https://github.com/snapshot-labs/snapshot/blob/develop/src/helpers/queries.ts
class GqlLazyLoader {
  private static gql;

  private static async init() {
    if (!this.gql) {
      this.gql = (await import('graphql-tag')).gql;
    }
  }

  public static async SPACE_QUERY() {
    await this.init();
    return this.gql`
  query Space($space: String) {
    space(id: $space) {
      id
      name
      about
      symbol
      private
      network
      avatar
      validation {
        params
      }
      voting {
        period
        delay
      }
      filters {
        minScore
        onlyMembers
      }
      strategies {
        name
        network
        params
      }
      members
    }
  }
`;
  }

  public static async MULTIPLE_SPACE_QUERY() {
    await this.init();
    return this.gql`
 query Spaces($id_in: [String!]) {
    spaces(
      where: {
        id_in: $id_in
      }
    ) {
      id
      name
      about
      network
      symbol
      strategies {
        name
        params
      }
      avatar
      admins
      members
      filters {
        minScore
        onlyMembers
      }
      plugins
    }
  }
`;
  }

  public static async PROPOSAL_QUERY() {
    await this.init();
    return this.gql`
  query Proposals(
    $id: Int!
  ) {
    proposals(
      where: {
        id: $id
      }
    ) {
      id
      title
      space
    }
  }
`;
  }

  public static async PROPOSALS_QUERY() {
    await this.init();
    return this.gql`
  query Proposals(
    $first: Int!
    $skip: Int!
    $state: String!
    $space: String
    $space_in: [String]
    $author_in: [String]
  ) {
    proposals(
      first: $first
      skip: $skip
      where: {
        space: $space
        state: $state
        space_in: $space_in
        author_in: $author_in
      }
    ) {
      id
      ipfs
      title
      body
      choices
      type
      start
      end
      snapshot
      state
      scores
      scores_total
      author
      created
      strategies {
        name
        network
        params
      }
    }
  }
`;
  }

  public static async PROPOSAL_VOTES_QUERY() {
    await this.init();
    return this.gql`
  query Votes($proposalHash: String!) {
    votes(
      first: 1000
      skip: 0
      where: { proposal: $proposalHash }
      orderBy: "created"
      orderDirection: desc
    ) {
      id
      voter
      created
      choice
    }
  }
`;
  }
}

async function getApolloClient() {
  if (apolloClient) return apolloClient;

  const { ApolloClient, createHttpLink, InMemoryCache } = await import(
    '@apollo/client/core'
  );

  // HTTP connection to the API
  const httpLink = createHttpLink({
    // You should use an absolute URL here
    uri: `${
      process.env.SNAPSHOT_HUB_URL || 'https://hub.snapshot.org'
    }/graphql`,
  });

  // Create the apollo client
  apolloClient = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
    defaultOptions: {
      query: {
        fetchPolicy: 'no-cache',
      },
    },
  });
  return apolloClient;
}

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

export async function getVersion(): Promise<string> {
  return '0.1.3';
}

export async function getSpace(space: string): Promise<SnapshotSpace> {
  await getApolloClient();
  const spaceObj = await apolloClient.query({
    query: await GqlLazyLoader.SPACE_QUERY(),
    variables: {
      space,
    },
  });
  return spaceObj.data.space;
}

export async function getMultipleSpaces(space: string): Promise<SnapshotSpace> {
  await getApolloClient();
  const spaceObj = await apolloClient.query({
    query: await GqlLazyLoader.SPACE_QUERY(),
    variables: {
      space,
    },
  });

  return spaceObj.data.space;
}

export async function getMultipleSpacesById(
  id_in: Array<string>,
): Promise<Array<SnapshotSpace>> {
  await getApolloClient();
  const spaceObj = await apolloClient.query({
    query: await GqlLazyLoader.MULTIPLE_SPACE_QUERY(),
    variables: {
      id_in,
    },
  });

  return spaceObj.data.spaces;
}

export async function getProposal(
  id: string,
): Promise<{ title: string; space: string }> {
  await getApolloClient();
  const proposalObj = await apolloClient.query({
    query: await GqlLazyLoader.PROPOSAL_QUERY(),
    variables: {
      id: +id,
    },
  });
  return proposalObj.data?.proposals[0];
}

export async function getProposals(space: string): Promise<SnapshotProposal[]> {
  await getApolloClient();
  const proposalsObj = await apolloClient.query({
    query: await GqlLazyLoader.PROPOSALS_QUERY(),
    variables: {
      space,
      state: 'all',
      // TODO: pagination in UI
      first: 1000,
      skip: 0,
    },
  });
  return proposalsObj.data.proposals;
}

export async function getVotes(
  proposalHash: string,
): Promise<SnapshotProposalVote[]> {
  await getApolloClient();
  const response = await apolloClient.query({
    query: await GqlLazyLoader.PROPOSAL_VOTES_QUERY(),
    variables: {
      proposalHash,
    },
  });
  return response.data.votes;
}

export async function castVote(address: string, payload: any) {
  const { Web3Provider } = await import('@ethersproject/providers');
  const web3 = new Web3Provider((window as any).ethereum);
  const client = await SnapshotLazyLoader.getClient();
  await client.vote(web3 as any, address, payload);
}

export async function createProposal(address: string, payload: any) {
  const { Web3Provider } = await import('@ethersproject/providers');
  const web3 = new Web3Provider((window as any).ethereum);
  const client = await SnapshotLazyLoader.getClient();

  const receipt = await client.proposal(web3 as any, address, payload);
  return receipt;
}

export async function getSpaceBlockNumber(network: string): Promise<number> {
  const snapshot = await SnapshotLazyLoader.getSnapshot();
  return snapshot.utils.getBlockNumber(snapshot.utils.getProvider(network));
}

export async function getScore(space: SnapshotSpace, address: string) {
  const snapshot = await SnapshotLazyLoader.getSnapshot();
  return snapshot.utils.getScores(
    space.id,
    space.strategies,
    space.network,
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
    let votes = await getVotes(proposal.id);
    const strategies = proposal.strategies ?? space.strategies;

    if (proposal.state !== 'pending') {
      let attempts = 0;
      while (attempts <= 3) {
        try {
          const snapshot = await SnapshotLazyLoader.getSnapshot();
          const scores = await snapshot.utils.getScores(
            space.id,
            strategies,
            space.network,
            votes.map((vote) => vote.voter),
            parseInt(proposal.snapshot, 10),
            // provider,
          );
          votes = votes
            .map((vote: any) => {
              vote.scores = strategies.map(
                (strategy, i) => scores[i][vote.voter] || 0,
              );
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

    return { votes, results };
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
      space.id,
      proposal.strategies,
      space.network,
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
      const proposals = await getProposals(cleanSpaceId);
      const space = await getSpace(cleanSpaceId);
      spacesData.push({ space, proposals });
    } catch (e) {
      console.error(`Failed to initialize snapshot: ${cleanSpaceId}.`);
    }
  }

  return spacesData;
}

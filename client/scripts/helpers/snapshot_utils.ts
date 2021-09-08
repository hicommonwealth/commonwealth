import gql from 'graphql-tag';

let apolloClient = null;
async function getApolloClient() {
  if (apolloClient) return apolloClient;

  const {
    ApolloClient,
    createHttpLink,
    InMemoryCache
  } = await import('@apollo/client/core');

  // HTTP connection to the API
  const httpLink = createHttpLink({
    // You should use an absolute URL here
    uri: `${process.env.SNAPSHOT_HUB_URL || 'https://hub.snapshot.org'}/graphql`
  });

  // Create the apollo client
  apolloClient = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
    defaultOptions: {
      query: {
        fetchPolicy: 'no-cache'
      }
    }
  });
  return apolloClient;
}

export const SPACE_QUERY = gql`
  query Space(
    $space: String
  ) {
    space(id: $space) {
      id
      name
      about
      symbol
      private
      network
      filters {
        minScore
        onlyMembers
      }
      strategies {
        name
        params
      }
      members
    }
  }
`;

export const PROPOSALS_QUERY = gql`
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
      start
      end
      snapshot
      state
      author
      created
    }
  }
`;

export const PROPOSAL_VOTES_QUERY = gql`
  query Votes(
    $proposalHash: String!
  ) {
    votes (
      first: 10000
      skip: 0
      where: {
        proposal: $proposalHash
      }
      orderBy: "created",
      orderDirection: desc
    ) {
      id
      voter
      created
      choice
    }
  }
`;

export interface SnapshotSpace {
  id: string;
  name: string;
  about: string;
  symbol: string;
  private: boolean;
  network: string;
  filters: {
    minScore: number,
    onlyMembers: boolean,
  }
  strategies: Array<{
    name: string;
    params: any;
  }>;
  members: string[];
}

export interface SnapshotProposal {
  id: string;
  ipfs: string;
  author: string;
  created: number;
  start: number;
  end: number;
  title: string;
  body: string
  snapshot: string;
  choices: string[];
}

export interface SnapshotProposalVote {
  id: string;
  voter: string;
  created: number;
  choice: number;
}

export async function getSpace(space: string): Promise<SnapshotSpace> {
  const client = await getApolloClient();
  const spaceObj = await client.query({
    query: SPACE_QUERY,
    variables: {
      space,
    }
  });
  return spaceObj.data.space;
}

export async function getProposals(space: string): Promise<SnapshotProposal[]> {
  const client = await getApolloClient();
  const proposalsObj = await client.query({
    query: PROPOSALS_QUERY,
    variables: {
      space,
      state: 'all',
      // TODO: pagination in UI
      first: 1000,
      skip: 0,
    }
  });
  return proposalsObj.data.proposals;
}

export async function getVotes(proposalHash: string): Promise<SnapshotProposalVote[]> {
  const client = await getApolloClient();
  const response = await client.query({
    query: PROPOSAL_VOTES_QUERY,
    variables: {
      proposalHash
    }
  });
  return response.data.votes;
}

export async function getSpaceBlockNumber(network: string): Promise<number> {
  const { default: Snapshot } = await import('@snapshot-labs/snapshot.js');
  return Snapshot.utils.getBlockNumber(Snapshot.utils.getProvider(network));
}

export async function getScores(space: SnapshotSpace, address: string) {
  const { default: Snapshot } = await import('@snapshot-labs/snapshot.js');
  return Snapshot.utils.getScores(
    space.id,
    space.strategies,
    space.network,
    Snapshot.utils.getProvider(space.network),
    [address]
  );
}

export async function getPower(space: SnapshotSpace, address: string, snapshot: string) {
  const { default: Snapshot } = await import('@snapshot-labs/snapshot.js');
  const blockNumber = await Snapshot.utils.getBlockNumber(Snapshot.utils.getProvider(space.network));
  const blockTag = +snapshot > blockNumber ? 'latest' : +snapshot;
  const scores: Array<{ [who: string]: number }> = await Snapshot.utils.getScores(
    space.id,
    space.strategies,
    space.network,
    Snapshot.utils.getProvider(space.network),
    [address],
    blockTag,
  );
  const summedScores = scores.map((score) => Object.values(score).reduce((a, b) => a + b, 0));
  return {
    scores: summedScores,
    totalScore: summedScores.reduce((a, b) => a + b, 0)
  };
}

import gql from 'graphql-tag';
import snapshot from '@snapshot-labs/snapshot.js';
import { Web3Provider } from '@ethersproject/providers';
import { notifyError } from '../controllers/app/notifications';
const hub = 'https://hub.snapshot.org'; // or https://testnet.snapshot.org for testnet
const client = new snapshot.Client712(hub);

let apolloClient = null;
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

// Queries from: https://github.com/snapshot-labs/snapshot/blob/develop/src/helpers/queries.ts

export const SPACE_QUERY = gql`
  query Space($space: String) {
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
        network
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

export const PROPOSAL_VOTES_QUERY = gql`
  query Votes($proposalHash: String!) {
    votes(
      first: 10000
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

export interface SnapshotSpace {
  id: string;
  name: string;
  about: string;
  symbol: string;
  private: boolean;
  network: string;
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

export interface SnapshotProposalVote {
  id: string;
  voter: string;
  created: number;
  choice: number;
  balance: number;
}

export async function getVersion(): Promise<string> {
  return '0.1.3';
}

export async function getSpace(space: string): Promise<SnapshotSpace> {
  const client = await getApolloClient();
  const spaceObj = await client.query({
    query: SPACE_QUERY,
    variables: {
      space,
    },
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
    },
  });
  return proposalsObj.data.proposals;
}

export async function getVotes(
  proposalHash: string
): Promise<SnapshotProposalVote[]> {
  const client = await getApolloClient();
  const response = await client.query({
    query: PROPOSAL_VOTES_QUERY,
    variables: {
      proposalHash,
    },
  });
  return response.data.votes;
}

export async function castVote(address: string, payload: any) {
  const web3 = new Web3Provider((window as any).ethereum);
  const receipt = await client.vote(web3 as any, address, payload);
}

export async function createProposal(address: string, payload: any) {
  const web3 = new Web3Provider((window as any).ethereum);

  const receipt = await client.proposal(web3 as any, address, payload);
  return receipt;
}

export async function getSpaceBlockNumber(network: string): Promise<number> {
  return snapshot.utils.getBlockNumber(snapshot.utils.getProvider(network));
}

export async function getScore(space: SnapshotSpace, address: string) {
  return snapshot.utils.getScores(
    space.id,
    space.strategies,
    space.network,
    [address]
    // Snapshot.utils.getProvider(space.network),
  );
}

/* Single Choice Voting */

export async function getResults(
  space: SnapshotSpace,
  proposal: SnapshotProposal
) {
  try {
    let votes = await getVotes(proposal.id);
    const strategies = proposal.strategies ?? space.strategies;

    if (proposal.state !== 'pending') {
      let attempts = 0;
      while (attempts <= 3) {
        try {
         const scores = await snapshot.utils.getScores(
            space.id,
            strategies,
            space.network,
            votes.map((vote) => vote.voter),
            parseInt(proposal.snapshot, 10)
            // provider,
          );
          votes = votes
            .map((vote: any) => {
              vote.scores = strategies.map(
                (strategy, i) => scores[i][vote.voter] || 0
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
    const votingClass = new snapshot.utils.voting[proposal.type](
      proposal,
      votes,
      strategies
    );
    const results = {
      resultsByVoteBalance: votingClass.getScores(),
      resultsByStrategyScore: votingClass.getScoresByStrategy(),
      sumOfResultsBalance: votingClass.getScoresTotal(),
    };

    return { votes, results };
  } catch (e) {
    console.error(e);
    return e;
  }
}

export async function getPower(
  space: SnapshotSpace,
  proposal: SnapshotProposal,
  address: string
) {
  const blockNumber = await snapshot.utils.getBlockNumber(
    snapshot.utils.getProvider(space.network)
  );
  const blockTag =
    +proposal.snapshot > blockNumber ? 'latest' : +proposal.snapshot;
  const scores: Array<{ [who: string]: number }> =
    await snapshot.utils.getScores(
      space.id,
      proposal.strategies,
      space.network,
      [address],
      blockTag
      // Snapshot.utils.getProvider(space.network),
    );
  const summedScores = scores.map((score) =>
    Object.values(score).reduce((a, b) => a + b, 0)
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

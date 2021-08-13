import {
  ApolloClient,
  createHttpLink,
  InMemoryCache
} from '@apollo/client/core';
import gql from 'graphql-tag';

// HTTP connection to the API
const httpLink = createHttpLink({
  // You should use an absolute URL here
  uri: `${process.env.SNAPSHOT_HUB_URL || 'https://hub.snapshot.org'}/graphql`
});

// Create the apollo client
export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: 'no-cache'
    }
  }
});

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

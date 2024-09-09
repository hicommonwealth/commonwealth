import { useQuery } from '@tanstack/react-query';
import request from 'graphql-request';
import gql from 'graphql-tag';
import { ExternalEndpoints } from 'state/api/config';

const PROPOSALS_STALE_TIME = 3 * 1_000 * 60; // 3 minutes

const GET_PROPOSALS_QUERY = gql`
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

interface UseGetSnapshotProposalsQueryProps {
  space: string;
}

const getProposals = async ({ space }: UseGetSnapshotProposalsQueryProps) => {
  return await request(
    ExternalEndpoints.snapshotHub.graphql,
    GET_PROPOSALS_QUERY,
    {
      space,
      state: 'all',
      first: 50,
      skip: 0,
    },
  );
};

const useGetSnapshotProposalsQuery = ({
  space,
}: UseGetSnapshotProposalsQueryProps) => {
  return useQuery({
    queryKey: [ExternalEndpoints.snapshotHub.url, 'proposals', space],
    queryFn: () => getProposals({ space }),
    staleTime: PROPOSALS_STALE_TIME,
  });
};

export default useGetSnapshotProposalsQuery;

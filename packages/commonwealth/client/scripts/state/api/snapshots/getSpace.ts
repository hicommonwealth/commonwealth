import { useQuery } from '@tanstack/react-query';
import request from 'graphql-request';
import gql from 'graphql-tag';
import { ExternalEndpoints } from 'state/api/config';

const SPACE_STALE_TIME = 3 * 1_000 * 60; // 3 minutes

const GET_SPACE_QUERY = gql`
  query Space($space: String!) {
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

interface UseGetContestsQueryProps {
  space: string;
}

const getSpace = async ({ space }: UseGetContestsQueryProps) => {
  return await request(ExternalEndpoints.snapshotHub.graphql, GET_SPACE_QUERY, {
    space,
  });
};

const useGetSnapshotSpaceQuery = ({ space }: UseGetContestsQueryProps) => {
  return useQuery({
    queryKey: [ExternalEndpoints.snapshotHub.url, 'space', space],
    queryFn: () => getSpace({ space }),
    staleTime: SPACE_STALE_TIME,
  });
};

export default useGetSnapshotSpaceQuery;

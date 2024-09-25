import { useQuery } from '@tanstack/react-query';
import request, { gql } from 'graphql-request';
import { ExternalEndpoints, queryClient } from 'state/api/config';

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

interface SpaceQueryResponse {
  space: {
    id: string;
    name: string;
    about: string;
    symbol: string;
    private: boolean;
    network: string;
    avatar: string;
    validation: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      params: any;
    };
    voting: {
      period: number;
      delay: number;
    };
    filters: {
      minScore: number;
      onlyMembers: boolean;
    };
    strategies: {
      name: string;
      network: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      params: any;
    }[];
    members: string[];
  };
}

interface UseGetSnapshotSpaceQueryProps {
  space: string;
}

const getSpace = async ({ space }: UseGetSnapshotSpaceQueryProps) => {
  const res = await request<SpaceQueryResponse>(
    ExternalEndpoints.snapshotHub.graphql,
    GET_SPACE_QUERY,
    {
      space,
    },
  );

  return res.space;
};

export const getSnapshotSpaceQuery = async ({
  space,
}: UseGetSnapshotSpaceQueryProps) => {
  return await queryClient.fetchQuery({
    queryKey: [ExternalEndpoints.snapshotHub.url, 'space', space],
    queryFn: () => getSpace({ space }),
    staleTime: SPACE_STALE_TIME,
  });
};

const useGetSnapshotSpaceQuery = ({ space }: UseGetSnapshotSpaceQueryProps) => {
  return useQuery({
    queryKey: [ExternalEndpoints.snapshotHub.url, 'space', space],
    queryFn: () => getSpace({ space }),
    staleTime: SPACE_STALE_TIME,
  });
};

export default useGetSnapshotSpaceQuery;

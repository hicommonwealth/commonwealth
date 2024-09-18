import { useQuery } from '@tanstack/react-query';
import request, { gql } from 'graphql-request';
import { ExternalEndpoints, queryClient } from 'state/api/config';

const VOTES_STALE_TIME = 3 * 1_000 * 60; // 3 minutes

const GET_VOTES_QUERY = gql`
  query Votes($proposalId: String!) {
    votes(
      first: 1000
      skip: 0
      where: { proposal: $proposalId }
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

interface VotesQueryResponse {
  votes: {
    id: string;
    voter: string;
    created: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    choice: any;
  }[];
}

interface UseGetVotesQueryProps {
  proposalId?: string;
}

const getVotes = async ({ proposalId }: UseGetVotesQueryProps) => {
  const res = await request<VotesQueryResponse>(
    ExternalEndpoints.snapshotHub.graphql,
    GET_VOTES_QUERY,
    {
      proposalId,
    },
  );

  return res.votes;
};

export const getSnapshotVotesQuery = async ({
  proposalId,
}: UseGetVotesQueryProps) => {
  return await queryClient.fetchQuery({
    queryKey: [ExternalEndpoints.snapshotHub.url, 'votes', proposalId],
    queryFn: () => getVotes({ proposalId }),
    staleTime: VOTES_STALE_TIME,
  });
};

const useGetVotesQuery = ({ proposalId }: UseGetVotesQueryProps) => {
  return useQuery({
    queryKey: [ExternalEndpoints.snapshotHub.url, 'votes', proposalId],
    queryFn: () => getVotes({ proposalId }),
    staleTime: VOTES_STALE_TIME,
    enabled: !!proposalId,
  });
};

export default useGetVotesQuery;

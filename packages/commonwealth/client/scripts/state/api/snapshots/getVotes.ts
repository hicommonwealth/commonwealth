import { useQuery } from '@tanstack/react-query';
import request from 'graphql-request';
import gql from 'graphql-tag';
import { ExternalEndpoints } from 'state/api/config';

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

interface UseGetVotesQueryProps {
  proposalId?: string;
}

const getVotes = async ({ proposalId }: UseGetVotesQueryProps) => {
  return await request(ExternalEndpoints.snapshotHub.graphql, GET_VOTES_QUERY, {
    proposalId,
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

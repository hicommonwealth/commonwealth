import { useQuery } from '@tanstack/react-query';
import request, { gql } from 'graphql-request';
import { ExternalEndpoints, queryClient } from 'state/api/config';

const PROPOSAL_STALE_TIME = 3 * 1_000 * 60; // 3 minutes

const GET_PROPOSAL_QUERY = gql`
  query Proposals($id: Int!) {
    proposals(where: { id: $id }) {
      id
      title
      space {
        id
      }
    }
  }
`;

interface UseGetSnapshotProposalQueryProps {
  id: string;
}

interface ProposalsQueryResponse {
  proposals: {
    id: number;
    title: string;
    space: { id: string };
  }[];
}

const getProposal = async ({ id }: UseGetSnapshotProposalQueryProps) => {
  const res = await request<ProposalsQueryResponse>(
    ExternalEndpoints.snapshotHub.graphql,
    GET_PROPOSAL_QUERY,
    {
      id,
    },
  );

  return res.proposals[0];
};

export const getSnapshotProposalQuery = async ({
  id,
}: UseGetSnapshotProposalQueryProps) => {
  return await queryClient.fetchQuery({
    queryKey: [ExternalEndpoints.snapshotHub.url, 'proposal', id],
    queryFn: () => getProposal({ id }),
    staleTime: PROPOSAL_STALE_TIME,
  });
};

const useGetSnapshotProposalQuery = ({
  id,
}: UseGetSnapshotProposalQueryProps) => {
  return useQuery({
    queryKey: [ExternalEndpoints.snapshotHub.url, 'proposal', id],
    queryFn: () => getProposal({ id }),
    staleTime: PROPOSAL_STALE_TIME,
  });
};

export default useGetSnapshotProposalQuery;

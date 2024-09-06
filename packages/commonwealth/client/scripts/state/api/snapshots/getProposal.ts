import { useQuery } from '@tanstack/react-query';
import request from 'graphql-request';
import gql from 'graphql-tag';
import { ExternalEndpoints } from 'state/api/config';

const PROPOSAL_STALE_TIME = 3 * 1_000 * 60; // 3 minutes

const GET_PROPOSAL_QUERY = gql`
  query Proposals($id: Int!) {
    proposals(where: { id: $id }) {
      id
      title
      space
    }
  }
`;

interface UseGetSnapshotProposalQueryProps {
  id: number;
}

const getProposal = async ({ id }: UseGetSnapshotProposalQueryProps) => {
  return await request(
    ExternalEndpoints.snapshotHub.graphql,
    GET_PROPOSAL_QUERY,
    {
      id,
    },
  );
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

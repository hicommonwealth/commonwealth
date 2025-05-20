import { trpc } from 'utils/trpcClient';

export type GetTopHoldersProps = {
  community_id: string;
  limit?: number;
  apiEnabled?: boolean;
};

export const useGetTopHoldersQuery = ({
  community_id,
  limit = 30,
  apiEnabled = true,
}: GetTopHoldersProps) => {
  return trpc.community.getTopHolders.useQuery(
    { community_id, limit },
    { enabled: apiEnabled },
  );
};

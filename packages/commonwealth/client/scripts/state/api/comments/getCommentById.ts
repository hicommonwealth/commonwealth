import { trpc } from 'client/scripts/utils/trpcClient';

const COMMENT_STALE_TIME = 5000; // 5 seconds

interface GetCommentByIdProps {
  comment_id: number;
  apiCallEnabled?: boolean;
}

const useGetCommentByIdQuery = ({
  comment_id,
  apiCallEnabled,
}: GetCommentByIdProps) => {
  return trpc.comment.getCommentById.useQuery(
    {
      comment_id,
    },
    {
      staleTime: COMMENT_STALE_TIME,
      enabled: apiCallEnabled,
    },
  );
};

export default useGetCommentByIdQuery;

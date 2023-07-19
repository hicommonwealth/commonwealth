import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';

const COMMENT_REACTIONS_STALE_TIME = 30 * 1_000; // 30 s

interface FetchCommentReactionsProps {
  chainId: string;
  commentId: number;
}

const fetchCommentReactions = async ({ commentId }: FetchCommentReactionsProps) => {
  return await axios.get(
    `${app.serverUrl()}/comments/${commentId}/reactions`
  ).then((response) => ([...(response.data.result || [])]));
};

const useFetchCommentReactionsQuery = ({ chainId, commentId }: FetchCommentReactionsProps) => {
  return useQuery({
    queryKey: [ApiEndpoints.getCommentReactions(commentId), chainId],
    queryFn: () => fetchCommentReactions({ commentId, chainId }),
    staleTime: COMMENT_REACTIONS_STALE_TIME,
  });
};

export default useFetchCommentReactionsQuery;

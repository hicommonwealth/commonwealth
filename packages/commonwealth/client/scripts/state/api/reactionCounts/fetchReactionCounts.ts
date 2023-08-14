// import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
// import { ApiEndpoints } from 'state/api/config';

// const THREAD_REACTION_COUNTS_STALE_TIME = 30 * 1_000; // 30 s

interface FetchReactionCountsProps {
  // chainId: string; // this should be used when we fully migrate thread controller to react query
  address: string;
  threadIds?: number[];
  proposalIds?: string[];
  commentIds?: string[];
}

const fetchReactionCounts = async ({
  address,
  threadIds,
  proposalIds,
  commentIds,
}: FetchReactionCountsProps) => {
  const response = await axios.post(`${app.serverUrl()}/reactionsCounts`, {
    ...(threadIds?.length > 0 && { thread_ids: threadIds }),
    ...(proposalIds?.length > 0 && { proposal_ids: proposalIds }),
    ...(commentIds?.length > 0 && { comment_ids: commentIds }),
    active_address: address,
  });

  return [...response.data.result];
};

// TODO: when we migrate the threads controller to react query, then we should also implement cache logic below
// for this query. The reason why it was not implemented is because "reactive" code from react query wont work in
// the non-reactive scope of threads controller.
// const useFetchReactionCountsQuery = ({ chainId, commentId }: FetchReactionCountsProps) => {
//   return useQuery({
//     queryKey: [ApiEndpoints.getCommentReactions(commentId), chainId],
//     queryFn: () => fetchReactionCounts({ commentId, chainId }),
//     staleTime: THREAD_REACTION_COUNTS_STALE_TIME,
//   });
// };

// export default useFetchReactionCountsQuery;
export default fetchReactionCounts;

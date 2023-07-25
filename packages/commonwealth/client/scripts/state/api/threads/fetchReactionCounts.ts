// import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
// import { ApiEndpoints } from 'state/api/config';

// const THREAD_REACTION_COUNTS_STALE_TIME = 30 * 1_000; // 30 s

interface FetchThreadReactionCountsProps {
  // chainId: string; // this should be used when we fully migrate thread controller to react query
  threadIds: number[];
}

const fetchThreadReactionCounts = async ({ threadIds }: FetchThreadReactionCountsProps) => {
  const response = await axios.post(`${app.serverUrl()}/reactionsCounts`, {
    thread_ids: threadIds,
    active_address: app.user.activeAccount?.address,
  });

  return [...response.data.result];
};

// TODO: when we migrate the threads controller to react query, then we should also implement cache logic below
// for this query. The reason why it was not implemented is because "reactive" code from react query wont work in
// the non-reactive scope of threads controller.
// const useFetchThreadReactionCountsQuery = ({ chainId, commentId }: FetchThreadReactionCountsProps) => {
//   return useQuery({
//     queryKey: [ApiEndpoints.getCommentReactions(commentId), chainId],
//     queryFn: () => fetchThreadReactionCounts({ commentId, chainId }),
//     staleTime: THREAD_REACTION_COUNTS_STALE_TIME,
//   });
// };

// export default useFetchThreadReactionCountsQuery;
export default fetchThreadReactionCounts;

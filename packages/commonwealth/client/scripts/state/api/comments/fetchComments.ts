import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Comment from 'models/Comment';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';

const COMMENTS_STALE_TIME = 30 * 1_000; // 30 s

interface FetchCommentsProps {
  threadId: number;
  communityId: string;
}

const fetchComments = async ({ communityId, threadId }: FetchCommentsProps) => {
  const response = await axios.get(
    `${app.serverUrl()}${ApiEndpoints.FETCH_COMMENTS}`,
    {
      params: {
        community_id: communityId || app.activeChainId(),
        thread_id: threadId,
      },
    },
  );

  // transform response
  return response.data.result.map((c) => new Comment(c));
};

const useFetchCommentsQuery = ({
  communityId,
  threadId,
}: FetchCommentsProps) => {
  return useQuery({
    queryKey: [ApiEndpoints.FETCH_COMMENTS, communityId, threadId],
    queryFn: () => fetchComments({ communityId, threadId }),
    staleTime: COMMENTS_STALE_TIME,
  });
};

export default useFetchCommentsQuery;

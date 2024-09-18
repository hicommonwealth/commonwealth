import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Comment from 'models/Comment';
import app from 'state';
import { ApiEndpoints, SERVER_URL } from 'state/api/config';

const COMMENTS_STALE_TIME = 30 * 1_000; // 30 s

interface FetchCommentsProps {
  threadId: number;
  communityId: string;
  apiEnabled?: boolean;
}

const fetchComments = async ({ communityId, threadId }: FetchCommentsProps) => {
  const response = await axios.get(
    `${SERVER_URL}${ApiEndpoints.FETCH_COMMENTS}`,
    {
      params: {
        community_id: communityId || app.activeChainId(),
        thread_id: threadId,
      },
    },
  );

  // transform response
  return response.data.result.map(
    (c) => new Comment({ community_id: undefined, ...c }),
  );
};

const useFetchCommentsQuery = ({
  communityId,
  threadId,
  apiEnabled = true,
}: FetchCommentsProps) => {
  return useQuery({
    queryKey: [ApiEndpoints.FETCH_COMMENTS, communityId, threadId],
    queryFn: () => fetchComments({ communityId, threadId }),
    staleTime: COMMENTS_STALE_TIME,
    enabled: apiEnabled,
  });
};

export default useFetchCommentsQuery;

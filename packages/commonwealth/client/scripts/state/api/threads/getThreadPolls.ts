import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Poll from 'models/Poll';
import { ApiEndpoints, SERVER_URL } from 'state/api/config';

const POLLS_STALE_TIME = 60 * 1000; // 1 minute

interface GetThreadPollsProps {
  threadId: number;
  communityId: string;
  apiCallEnabled: boolean;
}

const getThreadPolls = async ({
  threadId,
  communityId,
}: Omit<GetThreadPollsProps, 'apiCallEnabled'>): Promise<Poll[]> => {
  const response = await axios.get(
    `${SERVER_URL}${ApiEndpoints.fetchThreadPolls(threadId)}`,
    {
      params: {
        chain: communityId,
      },
    },
  );

  return response.data.result.map((poll) => Poll.fromJSON(poll));
};

const useGetThreadPolls = ({
  threadId,
  communityId,
  apiCallEnabled,
}: GetThreadPollsProps) => {
  return useQuery({
    queryKey: [
      ApiEndpoints.fetchThreadPolls(threadId),
      communityId,
      apiCallEnabled,
    ],
    queryFn: () => getThreadPolls({ threadId, communityId }),
    staleTime: POLLS_STALE_TIME,
    enabled: apiCallEnabled,
  });
};

export default useGetThreadPolls;

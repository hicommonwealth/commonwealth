import { trpc } from 'client/scripts/utils/trpcClient';

const TOPIC_STALE_TIME = 30 * 1_000; // 30 s

interface GetTopicByIdProps {
  topicId: number;
  apiEnabled?: boolean;
}

const useGetTopicByIdQuery = ({
  topicId,
  apiEnabled = true,
}: GetTopicByIdProps) => {
  return trpc.community.getTopicById.useQuery(
    {
      topic_id: topicId,
    },
    {
      staleTime: TOPIC_STALE_TIME,
      enabled: apiEnabled,
    },
  );
};

export default useGetTopicByIdQuery;

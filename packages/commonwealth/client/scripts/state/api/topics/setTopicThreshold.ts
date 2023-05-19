import axios from 'axios';
import app from 'state';
import { useMutation } from '@tanstack/react-query';
import { ApiEndpoints, queryClient } from 'state/api/config';

interface SetTopicThresholdProps {
  topicId: number;
  topicThreshold: string;
}

const setTopicThreshold = async ({
  topicId,
  topicThreshold,
}: SetTopicThresholdProps) => {
  await axios.post(`${app.serverUrl()}/setTopicThreshold`, {
    topic_id: topicId,
    token_threshold: topicThreshold,
    jwt: app.user.jwt,
  });
};

const useSetTopicThresholdMutation = () => {
  return useMutation({
    mutationFn: setTopicThreshold,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [ApiEndpoints.BulkTopics],
      });
    },
  });
};

export default useSetTopicThresholdMutation;

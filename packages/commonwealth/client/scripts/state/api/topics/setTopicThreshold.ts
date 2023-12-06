import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Topic from 'models/Topic';
import app from 'state';
import { ApiEndpoints, queryClient } from 'state/api/config';

interface SetTopicThresholdProps {
  topic: Topic;
  topicThreshold: string;
}

const setTopicThreshold = async ({
  topic,
  topicThreshold,
}: SetTopicThresholdProps) => {
  await axios.post(`${app.serverUrl()}/setTopicThreshold`, {
    topic_id: topic.id,
    token_threshold: topicThreshold,
    jwt: app.user.jwt,
  });
};

const useSetTopicThresholdMutation = () => {
  return useMutation({
    mutationFn: setTopicThreshold,
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: [ApiEndpoints.BULK_TOPICS, variables.topic.communityId],
      });
    },
  });
};

export default useSetTopicThresholdMutation;

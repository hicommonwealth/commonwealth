import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Topic from 'models/Topic';
import app from 'state';
import { updateThreadTopicInAllCaches } from './helpers/cache';

interface EditThreadTopicProps {
  address: string;
  chainId: string;
  threadId: number;
  topicName: string;
  newTopicId: number;
  oldTopicId: number;
}

const editThreadTopic = async ({
  address,
  chainId,
  threadId,
  topicName,
  newTopicId,
  oldTopicId
}: EditThreadTopicProps) => {
  const response = await axios.post(`${app.serverUrl()}/updateTopic`, {
    jwt: app.user.jwt,
    thread_id: threadId,
    topic_id: newTopicId,
    topic_name: topicName,
    address: address,
  })

  return { updatedTopic: new Topic(response.data.result), oldTopicId: oldTopicId }
};

interface UseEditThreadTopicMutationProps {
  chainId: string
  threadId: number;
}

const useEditThreadTopicMutation = ({ chainId, threadId }: UseEditThreadTopicMutationProps) => {
  return useMutation({
    mutationFn: editThreadTopic,
    onSuccess: async ({ updatedTopic, oldTopicId }) => {
      updateThreadTopicInAllCaches(chainId, threadId, updatedTopic, oldTopicId)

      return updatedTopic; // TODO: improve it and return thread as the proper response.
    }
  });
};

export default useEditThreadTopicMutation;

import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Topic from 'models/Topic';
import app from 'state';

interface EditThreadTopicProps {
  address: string;
  chainId: string;
  threadId: number;
  topicId: number;
  topicName: string;
}

const editThreadTopic = async ({
  address,
  chainId,
  threadId,
  topicId,
  topicName
}: EditThreadTopicProps) => {
  const response = await axios.post(`${app.serverUrl()}/updateTopic`, {
    jwt: app.user.jwt,
    thread_id: threadId,
    topic_id: topicId,
    topic_name: topicName,
    address: address,
  })

  return new Topic(response.data.result)
};

interface UseEditThreadTopicMutationProps {
  chainId: string
  threadId: number;
}

const useEditThreadTopicMutation = ({ chainId, threadId }: UseEditThreadTopicMutationProps) => {
  return useMutation({
    mutationFn: editThreadTopic,
    onSuccess: async (updatedTopic) => {
      // TODO: migrate the thread store objects, then clean this up
      const foundThread = app.threads.getById(threadId);
      foundThread.topic = updatedTopic;
      app.threads.updateThreadInStore(foundThread);

      return updatedTopic; // TODO: improve it and return thread as the proper response.
    }
  });
};

export default useEditThreadTopicMutation;

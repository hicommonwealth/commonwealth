import Topic from 'models/Topic';
import axios from 'axios';
import app from 'state';
import { useMutation } from '@tanstack/react-query';
import { ApiEndpoints, queryClient } from 'state/api/config';

interface EditTopicProps {
  topic: Topic;
  featuredOrder?: number;
}

const editTopic = async ({ topic, featuredOrder }: EditTopicProps) => {
  const response = await axios.post(`${app.serverUrl()}/editTopic`, {
    id: topic.id,
    chain: topic.chainId,
    name: topic.name,
    description: topic.description,
    telegram: topic.telegram,
    featured_in_sidebar: topic.featuredInSidebar,
    featured_in_new_post: topic.featuredInNewPost,
    default_offchain_template: topic.defaultOffchainTemplate,
    featured_order: featuredOrder,
    address: app.user.activeAccount.address,
    jwt: app.user.jwt,
  });

  return new Topic(response.data);
};

const useEditTopicMutation = () => {
  return useMutation({
    mutationFn: editTopic,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [ApiEndpoints.BulkTopics, variables.topic.chainId],
      });
    },
  });
};

export default useEditTopicMutation;

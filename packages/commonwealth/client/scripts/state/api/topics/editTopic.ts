import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Topic from 'models/Topic';
import app from 'state';
import { ApiEndpoints, queryClient } from 'state/api/config';

interface EditTopicProps {
  topic: Topic;
  featuredOrder?: number;
}

const editTopic = async ({ topic, featuredOrder }: EditTopicProps) => {
  const response = await axios.patch(`${app.serverUrl()}/topics/${topic.id}`, {
    id: topic.id,
    community_id: topic.communityId,
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
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: [ApiEndpoints.BULK_TOPICS, variables.topic.communityId],
      });
    },
  });
};

export default useEditTopicMutation;

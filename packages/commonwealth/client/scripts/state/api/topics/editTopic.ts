import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Topic from 'models/Topic';
import { ApiEndpoints, SERVER_URL, queryClient } from 'state/api/config';
import { userStore } from '../../ui/user';

interface EditTopicProps {
  topic: Topic;
  featuredOrder?: number;
  isPWA?: boolean;
}

const editTopic = async ({ topic, featuredOrder, isPWA }: EditTopicProps) => {
  const response = await axios.patch(
    `${SERVER_URL}/topics/${topic.id}`,
    {
      id: topic.id,
      community_id: topic.communityId,
      name: topic.name,
      description: topic.description,
      telegram: topic.telegram,
      featured_in_sidebar: topic.featuredInSidebar,
      featured_in_new_post: topic.featuredInNewPost,
      default_offchain_template: topic.defaultOffchainTemplate,
      featured_order: featuredOrder,
      address: userStore.getState().activeAccount?.address,
      jwt: userStore.getState().jwt,
    },
    {
      headers: {
        isPWA: isPWA?.toString(),
      },
    },
  );

  return new Topic(response.data.result);
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

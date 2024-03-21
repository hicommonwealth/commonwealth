import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Topic from 'models/Topic';
import app from 'state';
import { ApiEndpoints, queryClient } from 'state/api/config';

interface CreateTopicProps {
  name: string;
  description: string;
  telegram?: string;
  featuredInSidebar: boolean;
  featuredInNewPost: boolean;
  defaultOffchainTemplate: string;
}

const createTopic = async ({
  name,
  description,
  telegram,
  featuredInSidebar,
  featuredInNewPost,
  defaultOffchainTemplate,
}: CreateTopicProps) => {
  console.log(
    'createTopic',
    name,
    description,
    telegram,
    featuredInSidebar,
    featuredInNewPost,
    defaultOffchainTemplate,
  );
  const response = await axios.post(`${app.serverUrl()}/topics`, {
    name,
    description,
    telegram,
    featured_in_sidebar: featuredInSidebar,
    featured_in_new_post: featuredInNewPost,
    default_offchain_template: defaultOffchainTemplate,
    jwt: app.user.jwt,
    community_id: app.activeChainId(),
  });

  return new Topic(response.data.result);
};

const useCreateTopicMutation = () => {
  return useMutation({
    mutationFn: createTopic,
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: [ApiEndpoints.BULK_TOPICS, data.communityId],
      });
    },
  });
};

export default useCreateTopicMutation;

import axios from 'axios';
import app from 'state';
import Topic from 'models/Topic';
import { useMutation } from '@tanstack/react-query';
import { ApiEndpoints, queryClient } from 'state/api/config';

interface CreateTopicProps {
  name: string;
  description: string;
  telegram?: string;
  featuredInSidebar: boolean;
  featuredInNewPost: boolean;
  tokenThreshold: string;
  defaultOffchainTemplate: string;
}

const createTopic = async ({
  name,
  description,
  telegram,
  featuredInSidebar,
  featuredInNewPost,
  tokenThreshold,
  defaultOffchainTemplate,
}: CreateTopicProps) => {
  const response = await axios.post(`${app.serverUrl()}/createTopic`, {
    name,
    description,
    telegram,
    featured_in_sidebar: featuredInSidebar,
    featured_in_new_post: featuredInNewPost,
    token_threshold: tokenThreshold || '0',
    default_offchain_template: defaultOffchainTemplate,
    jwt: app.user.jwt,
    chain: app.activeChainId(),
  });

  return new Topic(response.data);
};

const useCreateTopicMutation = () => {
  return useMutation({
    mutationFn: createTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ApiEndpoints.BulkTopics] });
    },
  });
};

export default useCreateTopicMutation;

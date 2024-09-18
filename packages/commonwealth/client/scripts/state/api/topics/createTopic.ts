import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Topic from 'models/Topic';
import app from 'state';
import { ApiEndpoints, SERVER_URL, queryClient } from 'state/api/config';
import { userStore } from '../../ui/user';

interface CreateTopicProps {
  name: string;
  description: string;
  telegram?: string;
  featuredInSidebar: boolean;
  featuredInNewPost: boolean;
  defaultOffchainTemplate: string;
  isPWA?: boolean;
}

const createTopic = async ({
  name,
  description,
  telegram,
  featuredInSidebar,
  featuredInNewPost,
  defaultOffchainTemplate,
  isPWA,
}: CreateTopicProps) => {
  const response = await axios.post(
    `${SERVER_URL}/internal/CreateTopic`,
    {
      name,
      description,
      telegram,
      featured_in_sidebar: featuredInSidebar,
      featured_in_new_post: featuredInNewPost,
      default_offchain_template: defaultOffchainTemplate,
      jwt: userStore.getState().jwt,
      community_id: app.activeChainId(),
    },
    {
      headers: {
        address: userStore.getState().activeAccount?.address,
        isPWA: isPWA?.toString(),
      },
    },
  );

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

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
}

const createTopic = async ({
  name,
  description,
  telegram,
  featuredInSidebar,
}: CreateTopicProps) => {
  const response = await axios.post(`${app.serverUrl()}/topics`, {
    name,
    description,
    telegram,
    featured_in_sidebar: featuredInSidebar,
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

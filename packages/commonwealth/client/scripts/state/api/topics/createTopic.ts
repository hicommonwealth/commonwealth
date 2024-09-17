import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Topic from 'models/Topic';
import app from 'state';
import { ApiEndpoints, SERVER_URL, queryClient } from 'state/api/config';
import { TopicForm } from 'views/pages/CommunityManagement/Topics/Topics';
import { userStore } from '../../ui/user';

interface CreateTopicProps extends TopicForm {
  // TODO remove those types below when the CreateTopicSectionOld is removed
  name: string;
  description?: string;
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
  weightedVoting,
  chainNodeId,
  tokenAddress,
  tokenSymbol,
  voteWeightMultiplier,
}: CreateTopicProps) => {
  const response = await axios.post(
    `${SERVER_URL}/topics`,
    {
      name,
      description,
      telegram,
      featured_in_sidebar: featuredInSidebar,
      featured_in_new_post: featuredInNewPost,
      default_offchain_template: defaultOffchainTemplate,
      weighted_voting: weightedVoting,
      chain_node_id: chainNodeId,
      token_address: tokenAddress,
      token_symbol: tokenSymbol,
      vote_weight_multiplier: voteWeightMultiplier,
      jwt: userStore.getState().jwt,
      community_id: app.activeChainId(),
    },
    {
      headers: {
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

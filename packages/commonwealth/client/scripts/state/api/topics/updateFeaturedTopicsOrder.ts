import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Topic from 'models/Topic';
import app from 'state';
import { ApiEndpoints, queryClient } from 'state/api/config';

interface UpdateFeaturedTopicsOrderProps {
  featuredTopics: Topic[];
}

const updateFeaturedTopicsOrder = async ({
  featuredTopics,
}: UpdateFeaturedTopicsOrderProps) => {
  const orderedIds = featuredTopics
    .sort((a, b) => a.order - b.order)
    .map((t) => t.id);

  await axios.put(`${app.serverUrl()}/topics-order`, {
    community_id: app.activeChainId(),
    orderedIds,
    jwt: app.user.jwt,
  });
};

const useUpdateFeaturedTopicsOrderMutation = () => {
  return useMutation({
    mutationFn: updateFeaturedTopicsOrder,
    onSuccess: async (data, variables) => {
      const communityId = variables.featuredTopics[0].communityId;
      await queryClient.invalidateQueries({
        queryKey: [ApiEndpoints.BULK_TOPICS, communityId],
      });
    },
  });
};

export default useUpdateFeaturedTopicsOrderMutation;

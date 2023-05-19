import Topic from 'models/Topic';
import axios from 'axios';
import app from 'state';
import { useMutation } from '@tanstack/react-query';
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

  await axios.post(`${app.serverUrl()}/orderTopics`, {
    chain: app.activeChainId(),
    orderedIds,
    jwt: app.user.jwt,
  });
};

const useUpdateFeaturedTopicsOrderMutation = () => {
  return useMutation({
    mutationFn: updateFeaturedTopicsOrder,
    onSuccess: async (data, variables) => {
      const chainId = variables.featuredTopics[0].chainId;
      await queryClient.invalidateQueries({
        queryKey: [ApiEndpoints.BulkTopics, chainId],
      });
    },
  });
};

export default useUpdateFeaturedTopicsOrderMutation;

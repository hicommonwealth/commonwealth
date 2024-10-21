import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import type { Topic } from 'models/Topic';
import app from 'state';
import { SERVER_URL } from 'state/api/config';
import { trpc } from 'utils/trpcClient';
import { userStore } from '../../ui/user';

interface UpdateFeaturedTopicsOrderProps {
  featuredTopics: Topic[];
}

const updateFeaturedTopicsOrder = async ({
  featuredTopics,
}: UpdateFeaturedTopicsOrderProps) => {
  const orderedIds = featuredTopics
    // @ts-expect-error StrictNullChecks
    .sort((a, b) => a.order - b.order)
    .map((t) => t.id);

  await axios.put(`${SERVER_URL}/topics-order`, {
    community_id: app.activeChainId(),
    orderedIds,
    jwt: userStore.getState().jwt,
  });
};

const useUpdateFeaturedTopicsOrderMutation = () => {
  const utils = trpc.useUtils();
  return useMutation({
    mutationFn: updateFeaturedTopicsOrder,
    onSuccess: async (_, variables) => {
      await utils.community.getTopics.invalidate({
        community_id: variables.featuredTopics[0].community_id,
      });
    },
  });
};

export default useUpdateFeaturedTopicsOrderMutation;

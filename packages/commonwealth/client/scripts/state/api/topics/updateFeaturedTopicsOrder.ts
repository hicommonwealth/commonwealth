import type { Topic } from 'models/Topic';
import app from 'state';
import { trpc } from 'utils/trpcClient';

interface UpdateFeaturedTopicsOrderProps {
  featuredTopics: Topic[];
}

export const updateFeaturedTopicsOrderPayload = ({
  featuredTopics,
}: UpdateFeaturedTopicsOrderProps) => {
  const ordered_ids = featuredTopics
    .sort((a, b) => a.order! - b.order!)
    .map((t) => t.id!);
  return {
    community_id: app.activeChainId()!,
    ordered_ids,
  };
};

export const useUpdateFeaturedTopicsOrderMutation = () => {
  const utils = trpc.useUtils();
  return trpc.community.updateTopicsOrder.useMutation({
    onSuccess: async (_, variables) => {
      await utils.community.getTopics.invalidate({
        community_id: variables.community_id,
      });
    },
  });
};

import { trpc } from 'utils/trpcClient';

const useFetchWebhooksQuery = ({ communityId }: { communityId: string }) => {
  return trpc.webhook.getWebhooks.useQuery({
    community_id: communityId,
  });
};

export default useFetchWebhooksQuery;

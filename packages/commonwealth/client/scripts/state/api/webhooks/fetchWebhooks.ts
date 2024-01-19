import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Webhook from 'models/Webhook';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';

const WEBHOOKS_STALE_TIME = 30 * 1_000; // 30 s

interface FetchWebhooksProps {
  communityId: string;
  apiEnabled?: boolean;
}

const fetchWebhooks = async ({
  communityId,
}: FetchWebhooksProps): Promise<Webhook[]> => {
  const response = await axios.get(
    `${app.serverUrl()}${ApiEndpoints.FETCH_WEBHOOKS}`,
    {
      params: {
        chain: communityId || app.activeChainId(),
        auth: true,
        jwt: app.user.jwt,
      },
    },
  );

  return response.data.result.map(
    (t) => new Webhook(t.id, t.url, t.categories, t.community_id),
  );
};

const useFetchWebhooksQuery = ({
  communityId,
  apiEnabled = true,
}: FetchWebhooksProps) => {
  return useQuery({
    queryKey: [ApiEndpoints.FETCH_WEBHOOKS, communityId],
    queryFn: () => fetchWebhooks({ communityId }),
    staleTime: WEBHOOKS_STALE_TIME,
    enabled: apiEnabled,
  });
};

export default useFetchWebhooksQuery;

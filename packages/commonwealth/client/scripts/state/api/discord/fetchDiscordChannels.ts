import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { ApiEndpoints, SERVER_URL } from 'state/api/config';
import { userStore } from '../../ui/user';

const CHANNELS_STALE_TIME = 30 * 1_000; // 30 s

interface FetchDiscordChannelsProps {
  chainId: string;
  apiEnabled?: boolean;
}

const fetchChannels = async ({ chainId }: FetchDiscordChannelsProps) => {
  const response = await axios.post(
    `${SERVER_URL}${ApiEndpoints.DISCORD_CHANNELS}`,
    {
      community_id: chainId || app.activeChainId(),
      jwt: userStore.getState().jwt,
    },
  );

  return {
    textChannels: response.data.result.channels,
    selectedChannel: response.data.result.selectedChannel,
    forumChannels: response.data.result.forumChannels,
  };
};

const useFetchDiscordChannelsQuery = ({
  chainId,
  apiEnabled = true,
}: FetchDiscordChannelsProps) => {
  return useQuery({
    queryKey: [ApiEndpoints.DISCORD_CHANNELS, chainId],
    queryFn: () => fetchChannels({ chainId }),
    staleTime: CHANNELS_STALE_TIME,
    enabled: apiEnabled,
  });
};

export default useFetchDiscordChannelsQuery;

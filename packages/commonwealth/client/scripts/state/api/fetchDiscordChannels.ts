import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';

const CHANNELS_STALE_TIME = 30 * 1_000; // 30 s

interface FetchDiscordChannelsProps {
  chainId: string;
}

const fetchChannels = async ({ chainId }: FetchDiscordChannelsProps) => {
  const response = await axios.post(
    `${app.serverUrl()}${ApiEndpoints.DISCORD_CHANNELS}`,
    {
      community_id: chainId || app.activeChainId(),
      jwt: app.user.jwt,
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
}: FetchDiscordChannelsProps) => {
  return useQuery({
    queryKey: [ApiEndpoints.DISCORD_CHANNELS, chainId],
    queryFn: () => fetchChannels({ chainId }),
    staleTime: CHANNELS_STALE_TIME,
  });
};

export default useFetchDiscordChannelsQuery;

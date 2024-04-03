import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { ApiEndpoints, queryClient } from 'state/api/config';

interface RemoveDiscordBotConfigProps {
  communityId: string;
}

const removeDiscordBotConfig = async ({
  communityId,
}: RemoveDiscordBotConfigProps) => {
  await axios.post(
    `${app.serverUrl()}${ApiEndpoints.REMOVE_DISCORD_BOT_CONFIG}`,
    {
      community_id: communityId,
      jwt: app.user.jwt,
    },
  );
};

const useRemoveDiscordBotConfigMutation = () => {
  return useMutation({
    mutationFn: removeDiscordBotConfig,
    onSuccess: async () => {
      // remove channel query from cache to force refresh
      queryClient.removeQueries([ApiEndpoints.DISCORD_CHANNELS], {
        exact: true,
      });
    },
  });
};

export default useRemoveDiscordBotConfigMutation;

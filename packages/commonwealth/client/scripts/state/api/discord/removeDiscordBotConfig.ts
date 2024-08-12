import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { ApiEndpoints, SERVER_URL, queryClient } from 'state/api/config';
import { userStore } from '../../ui/user';

interface RemoveDiscordBotConfigProps {
  communityId: string;
}

const removeDiscordBotConfig = async ({
  communityId,
}: RemoveDiscordBotConfigProps) => {
  await axios.post(`${SERVER_URL}${ApiEndpoints.REMOVE_DISCORD_BOT_CONFIG}`, {
    community_id: communityId,
    jwt: userStore.getState().jwt,
  });
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

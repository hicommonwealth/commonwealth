import { ApiEndpoints, queryClient } from 'state/api/config';
import { trpc } from 'utils/trpcClient';

const useRemoveDiscordBotConfigMutation = () => {
  return trpc.discordBot.removeDiscordBotConfig.useMutation({
    onSuccess: async () => {
      queryClient.removeQueries([ApiEndpoints.DISCORD_CHANNELS], {
        exact: true,
      });
    },
  });
};

export default useRemoveDiscordBotConfigMutation;

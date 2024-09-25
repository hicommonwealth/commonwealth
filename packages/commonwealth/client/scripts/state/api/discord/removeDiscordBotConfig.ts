import { trpc } from 'utils/trpcClient';

const useRemoveDiscordBotConfigMutation = () => {
  const utils = trpc.useUtils();

  return trpc.discordBot.removeDiscordBotConfig.useMutation({
    onSuccess: async (_, variables) => {
      await utils.discordBot.getDiscordChannels.invalidate({
        community_id: variables.community_id,
      });
    },
  });
};

export default useRemoveDiscordBotConfigMutation;

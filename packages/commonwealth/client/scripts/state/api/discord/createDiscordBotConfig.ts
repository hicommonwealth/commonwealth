import { trpc } from 'utils/trpcClient';

const useCreateDiscordBotConfigMutation = () => {
  const utils = trpc.useUtils();

  return trpc.discordBot.createDiscordBotConfig.useMutation({
    onSuccess: async (_, variables) => {
      await utils.discordBot.getDiscordBotConfig.invalidate({
        community_id: variables.community_id,
      });
    },
  });
};

export default useCreateDiscordBotConfigMutation;

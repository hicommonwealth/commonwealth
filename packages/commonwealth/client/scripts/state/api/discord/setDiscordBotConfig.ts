import { trpc } from 'utils/trpcClient';

const useSetDiscordBotConfigMutation = () => {
  const utils = trpc.useUtils();

  return trpc.discordBot.setDiscordBotConfig.useMutation({
    onSuccess: async (_, variables) => {
      await utils.discordBot.getDiscordBotConfig.invalidate({
        community_id: variables.community_id,
      });
    },
  });
};

export default useSetDiscordBotConfigMutation;

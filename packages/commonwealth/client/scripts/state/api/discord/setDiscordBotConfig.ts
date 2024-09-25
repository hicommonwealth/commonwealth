import { trpc } from 'utils/trpcClient';

const useSetDiscordBotConfigMutation = () => {
  const utils = trpc.useUtils();

  return trpc.discordBot.setDiscordBotConfig.useMutation({
    onSuccess: async () => {
      await utils.discordBot.setDiscordBotConfig.invalidate();
    },
  });
};

export default useSetDiscordBotConfigMutation;

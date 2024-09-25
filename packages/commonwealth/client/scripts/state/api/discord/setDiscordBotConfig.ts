import { trpc } from 'utils/trpcClient';

const useSetDiscordBotConfigMutation = () => {
  return trpc.discordBot.setDiscordBotConfig.useMutation();
};

export default useSetDiscordBotConfigMutation;

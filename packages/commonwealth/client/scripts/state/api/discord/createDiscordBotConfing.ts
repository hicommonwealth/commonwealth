import { trpc } from 'utils/trpcClient';

const useCreateDiscordBotConfigMutation = () => {
  return trpc.discordBot.createDiscordBotConfig.useMutation();
};

export default useCreateDiscordBotConfigMutation;

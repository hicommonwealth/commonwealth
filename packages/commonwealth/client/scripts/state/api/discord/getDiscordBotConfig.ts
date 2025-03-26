import { trpc } from 'utils/trpcClient';

const useGetDiscordBotConfig = ({
  community_id,
  apiEnabled = true,
}: {
  community_id: string;
  apiEnabled: boolean;
}) => {
  return trpc.discordBot.getDiscordBotConfig.useQuery(
    {
      community_id,
    },
    {
      enabled: apiEnabled,
      staleTime: Infinity,
      cacheTime: Infinity,
    },
  );
};

export default useGetDiscordBotConfig;

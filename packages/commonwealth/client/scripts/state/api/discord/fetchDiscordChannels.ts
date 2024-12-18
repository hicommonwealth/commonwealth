import { GetDiscordChannels } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';

const CHANNELS_STALE_TIME = 30 * 1_000; // 30 s

type useFetchDiscordChannelsProps = z.infer<typeof GetDiscordChannels.input> & {
  apiEnabled?: boolean;
};

const useFetchDiscordChannelsQuery = ({
  community_id,
  apiEnabled = true,
}: useFetchDiscordChannelsProps) => {
  return trpc.discordBot.getDiscordChannels.useQuery(
    { community_id },
    {
      enabled: apiEnabled,
      staleTime: CHANNELS_STALE_TIME,
    },
  );
};

export default useFetchDiscordChannelsQuery;

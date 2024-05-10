import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { ApiEndpoints, queryClient } from 'state/api/config';

interface SetDiscordBotConfigProps {
  communityId: string;
  guildId: string;
  verificationToken: string;
}

const setDiscordBotConfig = async ({
  communityId,
  guildId,
  verificationToken,
}: SetDiscordBotConfigProps) => {
  const res = await axios.post(
    `${app.serverUrl()}${ApiEndpoints.SET_DISCORD_CONFIG}`,
    {
      community_id: communityId,
      guild_id: guildId,
      verification_token: verificationToken,
      jwt: app.user.jwt,
    },
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );

  return { communityId, discordConfigId: res?.data?.result?.discordConfigId };
};

const useSetDiscordBotConfigMutation = () => {
  return useMutation({
    mutationFn: setDiscordBotConfig,
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: [ApiEndpoints.SET_DISCORD_CONFIG, data.communityId],
      });
    },
  });
};

export default useSetDiscordBotConfigMutation;

import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { SERVER_URL } from 'state/api/config';
import { userStore } from '../../ui/user';

export interface CreateDiscordBotConfigProps {
  verificationToken: string;
}

const createDiscordBotConfig = async ({
  verificationToken,
}: CreateDiscordBotConfigProps) => {
  await axios.post(`${SERVER_URL}/createDiscordBotConfig`, {
    community_id: app.activeChainId(),
    verification_token: verificationToken,
    jwt: userStore.getState().jwt,
  });
};

const useCreateDiscordBotConfigMutation = () => {
  return useMutation({
    mutationFn: createDiscordBotConfig,
  });
};

export default useCreateDiscordBotConfigMutation;

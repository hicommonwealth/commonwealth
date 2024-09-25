import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { SERVER_URL } from 'state/api/config';
import { userStore } from '../../ui/user';

export interface SetForumChannelConnectionProps {
  topicId: string;
  channelId?: string;
}

const setForumChannelConnection = async ({
  topicId,
  channelId,
}: SetForumChannelConnectionProps) => {
  await axios.patch(`${SERVER_URL}/topics/${topicId}/channels/${channelId}`, {
    chain: app.activeChainId(),
    jwt: userStore.getState().jwt,
  });
};

const useSetForumChannelConnectionMutation = () => {
  return useMutation({
    mutationFn: setForumChannelConnection,
  });
};

export default useSetForumChannelConnectionMutation;

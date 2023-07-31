import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { ThreadStage } from 'models/types';
import app from 'state';
import { EXCEPTION_CASE_threadCountersStore } from '../../ui/thread';
import { removeThreadFromAllCaches } from './helpers/cache';

interface DeleteThreadProps {
  chainId: string;
  threadId: number;
}

const deleteThread = async ({
  chainId,
  threadId
}: DeleteThreadProps) => {
  return await axios.delete(`${app.serverUrl()}/threads/${threadId}`, {
    data: {
      jwt: app.user.jwt,
      chain_id: chainId,
    },
  })
};

interface UseDeleteThreadMutationProps {
  chainId: string
  threadId: number;
  currentStage: ThreadStage;
}

const useDeleteThreadMutation = ({ chainId, threadId, currentStage }: UseDeleteThreadMutationProps) => {
  return useMutation({
    mutationFn: deleteThread,
    onSuccess: async (response) => {
      // Update community level thread counters variables
      EXCEPTION_CASE_threadCountersStore.setState(({
        totalThreadsInCommunity,
        totalThreadsInCommunityForVoting
      }) => ({
        totalThreadsInCommunity: totalThreadsInCommunity - 1,
        totalThreadsInCommunityForVoting: currentStage === ThreadStage.Voting ?
          totalThreadsInCommunityForVoting - 1 :
          totalThreadsInCommunityForVoting,
      }))
      removeThreadFromAllCaches(chainId, threadId)
      return response.data
    }
  });
};

export default useDeleteThreadMutation;

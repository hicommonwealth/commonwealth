import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { signDeleteThread } from 'controllers/server/sessions';
import { ThreadStage } from 'models/types';
import { toCanvasSignedDataApiArgs } from 'shared/canvas/types';
import app from 'state';
import { EXCEPTION_CASE_threadCountersStore } from '../../ui/thread';
import { userStore } from '../../ui/user';
import { removeThreadFromAllCaches } from './helpers/cache';
import { updateCommunityThreadCount } from './helpers/counts';

interface DeleteThreadProps {
  communityId: string;
  threadId: number;
  address: string;
}

const deleteThread = async ({
  communityId,
  threadId,
  address,
}: DeleteThreadProps) => {
  const canvasSignedData = await signDeleteThread(address, {
    thread_id: threadId,
  });

  return await axios.delete(`${app.serverUrl()}/threads/${threadId}`, {
    data: {
      author_community_id: communityId,
      community_id: communityId,
      address: address,
      jwt: userStore.getState().jwt,
      ...toCanvasSignedDataApiArgs(canvasSignedData),
    },
  });
};

interface UseDeleteThreadMutationProps {
  communityId: string;
  threadId: number;
  currentStage: ThreadStage;
}

const useDeleteThreadMutation = ({
  communityId,
  threadId,
  currentStage,
}: UseDeleteThreadMutationProps) => {
  return useMutation({
    mutationFn: deleteThread,
    onSuccess: async (response) => {
      removeThreadFromAllCaches(communityId, threadId);

      // Update community level thread counters variables
      EXCEPTION_CASE_threadCountersStore.setState(
        ({ totalThreadsInCommunity, totalThreadsInCommunityForVoting }) => ({
          totalThreadsInCommunity: totalThreadsInCommunity - 1,
          totalThreadsInCommunityForVoting:
            currentStage === ThreadStage.Voting
              ? totalThreadsInCommunityForVoting - 1
              : totalThreadsInCommunityForVoting,
        }),
      );

      // decrement communities thread count
      if (communityId) updateCommunityThreadCount(communityId, 'decrement');

      return response.data;
    },
  });
};

export default useDeleteThreadMutation;

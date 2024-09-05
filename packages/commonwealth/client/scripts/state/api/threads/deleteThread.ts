import { toCanvasSignedDataApiArgs } from '@hicommonwealth/shared';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { signDeleteThread } from 'controllers/server/sessions';
import { ThreadStage } from 'models/types';
import { SERVER_URL } from 'state/api/config';
import { useAuthModalStore } from '../../ui/modals';
import { EXCEPTION_CASE_threadCountersStore } from '../../ui/thread';
import { userStore } from '../../ui/user';
import { removeThreadFromAllCaches } from './helpers/cache';

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

  return await axios.delete(`${SERVER_URL}/threads/${threadId}`, {
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
  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();

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

      return response.data;
    },
    onError: (error) => checkForSessionKeyRevalidationErrors(error),
  });
};

export default useDeleteThreadMutation;

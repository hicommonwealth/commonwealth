import { toCanvasSignedDataApiArgs } from '@hicommonwealth/shared';
import { signDeleteThread } from 'controllers/server/sessions';
import { ThreadStage } from 'models/types';
import { trpc } from 'utils/trpcClient';
import { useAuthModalStore } from '../../ui/modals';
import { updateCommunityThreadCount } from '../communities/getCommuityById';
import { removeThreadFromAllCaches } from './helpers/cache';

interface UseDeleteThreadMutationProps {
  address: string;
  communityId: string;
  threadId: number;
  threadMsgId: string;
  currentStage: ThreadStage;
}

export const buildDeleteThreadInput = async ({
  address,
  communityId,
  threadId,
  threadMsgId,
  currentStage,
}) => {
  const canvasSignedData = await signDeleteThread(address, {
    thread_id: threadMsgId,
  });
  return {
    address,
    communityId,
    threadId,
    threadMsgId,
    currentStage,
    ...toCanvasSignedDataApiArgs(canvasSignedData),
  };
};

const useDeleteThreadMutation = ({
  address,
  communityId,
  threadId,
  threadMsgId,
  currentStage,
}: UseDeleteThreadMutationProps) => {
  const utils = trpc.useUtils();
  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();

  return trpc.thread.deleteThread.useMutation({
    onSuccess: async (response) => {
      removeThreadFromAllCaches(communityId, threadId);

      // decrement communities thread count
      if (communityId) {
        updateCommunityThreadCount(
          communityId,
          'decrement',
          currentStage === ThreadStage.Voting,
          utils,
        );
      }

      return response;
    },
    onError: (error) => checkForSessionKeyRevalidationErrors(error),
  });
};

export default useDeleteThreadMutation;

import { toCanvasSignedDataApiArgs } from '@hicommonwealth/shared';
import Thread from 'client/scripts/models/Thread';
import { signDeleteThread } from 'controllers/server/sessions';
import { ThreadStage } from 'models/types';
import { trpc } from 'utils/trpcClient';
import { useAuthModalStore } from '../../ui/modals';
import { updateCommunityThreadCount } from '../communities/getCommuityById';
import { removeThreadFromAllCaches } from './helpers/cache';

export const buildDeleteThreadInput = async (
  address: string,
  thread: Thread,
) => {
  const canvasSignedData = await signDeleteThread(address, {
    thread_id: thread.canvasMsgId ?? null,
  });
  return {
    thread_id: thread.id,
    ...toCanvasSignedDataApiArgs(canvasSignedData),
  };
};

const useDeleteThreadMutation = (thread: Thread) => {
  const utils = trpc.useUtils();
  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();

  return trpc.thread.deleteThread.useMutation({
    onSuccess: (deleted) => {
      removeThreadFromAllCaches(thread.communityId, thread.id);

      // decrement communities thread count
      if (thread.communityId) {
        updateCommunityThreadCount(
          thread.communityId,
          'decrement',
          thread.stage === ThreadStage.Voting,
          utils,
        );
      }

      return deleted;
    },
    onError: (error) => checkForSessionKeyRevalidationErrors(error),
  });
};

export default useDeleteThreadMutation;

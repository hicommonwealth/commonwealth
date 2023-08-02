import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Thread from 'models/Thread';
import { ThreadStage } from 'models/types';
import app from 'state';
import { EXCEPTION_CASE_threadCountersStore } from '../../ui/thread';
import { updateThreadInAllCaches } from './helpers/cache';

interface EditThreadStageProps {
  chainId: string;
  threadId: number;
  stage: ThreadStage;
}

const editThreadStage = async ({
  chainId,
  threadId,
  stage,
}: EditThreadStageProps) => {
  const response = await axios.post(`${app.serverUrl()}/updateThreadStage`, {
    chain: chainId,
    thread_id: threadId,
    stage: stage,
    jwt: app.user.jwt,
  });

  return new Thread(response.data.result);
};

interface UseEditThreadStageMutationProps {
  chainId: string;
  threadId: number;
  currentStage: ThreadStage;
}

const useEditThreadStageMutation = ({
  chainId,
  threadId,
  currentStage,
}: UseEditThreadStageMutationProps) => {
  return useMutation({
    mutationFn: editThreadStage,
    onSuccess: async (updatedThread) => {
      // Update community level thread counters variables
      let incBy = 0;
      if (currentStage === ThreadStage.Voting) incBy--;
      if (updatedThread.stage === ThreadStage.Voting) incBy++;
      EXCEPTION_CASE_threadCountersStore.setState(
        ({ totalThreadsInCommunityForVoting }) => ({
          totalThreadsInCommunityForVoting:
            totalThreadsInCommunityForVoting + incBy,
        })
      );
      updateThreadInAllCaches(chainId, threadId, updatedThread);

      return updatedThread;
    },
  });
};

export default useEditThreadStageMutation;

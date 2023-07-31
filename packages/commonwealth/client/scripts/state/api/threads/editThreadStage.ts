import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { ThreadStage } from 'models/types';
import Thread from 'models/Thread';
import app from 'state';
import { updateThreadInAllCaches } from './helpers/cache';

interface EditThreadStageProps {
  chainId: string;
  threadId: number;
  stage: ThreadStage
}

const editThreadStage = async ({
  chainId,
  threadId,
  stage
}: EditThreadStageProps) => {
  const response = await axios.post(`${app.serverUrl()}/updateThreadStage`, {
    chain: chainId,
    thread_id: threadId,
    stage: stage,
    jwt: app.user.jwt,
  })

  return new Thread(response.data.result)
};

interface UseEditThreadStageMutationProps {
  chainId: string
  threadId: number;
  currentStage: ThreadStage;
}

const useEditThreadStageMutation = ({ chainId, threadId, currentStage }: UseEditThreadStageMutationProps) => {
  return useMutation({
    mutationFn: editThreadStage,
    onSuccess: async (updatedThread) => {
      updateThreadInAllCaches(chainId, threadId, updatedThread)
      // TODO: migrate the thread store objects, then clean this up
      // TODO: get this from react query state when fully migrated
      // if (args.stage === ThreadStage.Voting) app.threads.numVotingThreads--;
      if (updatedThread.stage === ThreadStage.Voting) app.threads.numVotingThreads++;
      return updatedThread;
    }
  });
};

export default useEditThreadStageMutation;

import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { ThreadStage } from 'models/types';
import app from 'state';

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

  return app.threads.modelFromServer(response.data.result)
};

interface UseEditThreadStageMutationProps {
  chainId: string
  threadId: number;
}

const useEditThreadStageMutation = ({ chainId, threadId }: UseEditThreadStageMutationProps) => {
  return useMutation({
    mutationFn: editThreadStage,
    onSuccess: async (updatedThread) => {
      // TODO: migrate the thread store objects, then clean this up
      // TODO: get this from react query state when fully migrated
      // if (args.stage === ThreadStage.Voting) app.threads.numVotingThreads--;
      if (updatedThread.stage === ThreadStage.Voting) app.threads.numVotingThreads++;
      // Post edits propagate to all thread stores
      app.threads._store.update(updatedThread);
      app.threads._listingStore.add(updatedThread);
      return updatedThread;
    }
  });
};

export default useEditThreadStageMutation;

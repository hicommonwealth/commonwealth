import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Thread from 'models/Thread';
import app from 'state';

interface EditThreadPrivacyProps {
  chainId: string;
  threadId: number;
  readOnly: boolean
}

const editThreadPrivacy = async ({
  chainId,
  threadId,
  readOnly
}: EditThreadPrivacyProps) => {
  const response = await axios.post(`${app.serverUrl()}/updateThreadPrivacy`, {
    thread_id: threadId,
    read_only: readOnly,
    jwt: app.user.jwt,
  })

  return app.threads.modelFromServer(response.data.result)
};

interface UseEditThreadPrivacyMutationProps {
  chainId: string
  threadId: number;
}

const useEditThreadPrivacyMutation = ({ chainId, threadId }: UseEditThreadPrivacyMutationProps) => {
  return useMutation({
    mutationFn: editThreadPrivacy,
    onSuccess: async (updatedThread) => {
      // TODO: migrate the thread store objects, then clean this up
      // update thread in store
      const foundThread = app.threads._store.getByIdentifier(updatedThread.identifier);
      const finalThread = new Thread({
        ...((foundThread || {}) as any),
        readOnly: updatedThread.readOnly,
      });
      app.threads._store.update(finalThread);
      app.threads._listingStore.add(finalThread);
      app.threads._overviewStore.update(finalThread);

      return updatedThread;
    }
  });
};

export default useEditThreadPrivacyMutation;

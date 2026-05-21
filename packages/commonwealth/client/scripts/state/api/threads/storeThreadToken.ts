import { trpc } from 'utils/trpcClient';

export const useStoreThreadTokenMutation = () => {
  return trpc.thread.createThreadToken.useMutation();
};

export default useStoreThreadTokenMutation;

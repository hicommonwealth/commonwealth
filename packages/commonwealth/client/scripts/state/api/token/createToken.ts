import { trpc } from 'utils/trpcClient';

const useCreateTokenMutation = () => {
  return trpc.token.createToken.useMutation();
};

export default useCreateTokenMutation;

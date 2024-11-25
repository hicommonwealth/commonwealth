import { trpc } from 'utils/trpcClient';
import useUserStore from '../../ui/user';
import { queryClient } from '../config';

const useCreateTokenMutation = () => {
  const user = useUserStore();

  return trpc.token.createToken.useMutation({
    onSuccess: () => {
      user.setData({ addressSelectorSelectedAddress: undefined });

      void queryClient.invalidateQueries({
        predicate: (query) => {
          const [path] = query.queryKey;
          if (Array.isArray(path) && path.length === 2) {
            const [entity, name] = path;
            if (entity === 'token' && name === 'getTokens') {
              return true;
            }
          }
          return false;
        },
      });
    },
  });
};

export default useCreateTokenMutation;

import { trpc } from 'utils/trpcClient';
import useUserStore from '../../ui/user';

const useCreateTokenMutation = () => {
  const user = useUserStore();

  return trpc.token.createToken.useMutation({
    onSuccess: () => {
      user.setData({ addressSelectorSelectedAddress: undefined });
    },
  });
};

export default useCreateTokenMutation;

import { trpc } from 'utils/trpcClient';
import useUserStore from '../../ui/user';

const useCreateTokenMutation = () => {
  const user = useUserStore();
  const utils = trpc.useUtils();

  return trpc.token.createToken.useMutation({
    onSuccess: async () => {
      user.setData({ addressSelectorSelectedAddress: undefined });

      await utils.token.getTokens.invalidate();
    },
  });
};

export default useCreateTokenMutation;

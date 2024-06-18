import { trpc } from 'utils/trpcClient';

const createCommonWallet = async () => {
  return trpc.wallet.CreateWallet.useMutation();
};

export default createCommonWallet;

import { trpc } from 'utils/trpcClient';

const createTransaction = () => {
  return trpc.wallet.SendTransaction.useMutation();
};

export default createTransaction;

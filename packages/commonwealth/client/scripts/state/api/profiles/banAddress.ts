import { trpc } from 'client/scripts/utils/trpcClient';

const useBanAddressMutation = () => {
  return trpc.community.banAddress.useMutation({});
};

export default useBanAddressMutation;

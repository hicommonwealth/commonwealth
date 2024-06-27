import { trpc } from 'utils/trpcClient';

const useUpdateCustomDomainMutation = () => {
  return trpc.community.updateCustomDomain.useMutation();
};

export default useUpdateCustomDomainMutation;

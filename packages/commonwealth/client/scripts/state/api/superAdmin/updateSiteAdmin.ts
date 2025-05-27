import { trpc } from 'utils/trpcClient';

const useUpdateSiteAdminMutation = () => {
  return trpc.superAdmin.updateSiteAdmin.useMutation({});
};

export default useUpdateSiteAdminMutation;

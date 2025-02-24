import { trpc } from 'utils/trpcClient';
const useUpdateResourceTimestamps = () => {
  return trpc.superAdmin.updateResourceTimestamps.useMutation({});
};
export default useUpdateResourceTimestamps;

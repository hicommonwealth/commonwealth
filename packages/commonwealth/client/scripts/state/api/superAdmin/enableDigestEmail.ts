import { trpc } from 'utils/trpcClient';
const useEnableDigestEmail = () => {
  return trpc.superAdmin.enableDigestEmail.useMutation({});
};
export default useEnableDigestEmail;

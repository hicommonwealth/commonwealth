import { trpc } from 'utils/trpcClient';

export function useUpdateRoleMutation() {
  return trpc.community.updateRole.useMutation({});
}

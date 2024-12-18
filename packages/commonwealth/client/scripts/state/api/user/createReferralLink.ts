import { trpc } from 'utils/trpcClient';

export const useCreateReferralLinkMutation = () => {
  const utils = trpc.useUtils();

  return trpc.user.createReferralLink.useMutation({
    onSuccess: async () => {
      await utils.user.getReferralLink.invalidate();
    },
  });
};

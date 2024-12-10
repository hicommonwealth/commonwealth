import { trpc } from 'utils/trpcClient';

export const useGetReferralLinkQuery = () => {
  return trpc.user.getReferralLink.useQuery({});
};

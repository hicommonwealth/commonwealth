import { useFlag } from 'hooks/useFlag';
import { trpc } from 'utils/trpcClient';
import useUserStore from '../../ui/user';

export const useGetReferralLinkQuery = () => {
  const user = useUserStore();
  const referralsEnabled = useFlag('referrals');

  return trpc.user.getReferralLink.useQuery(
    {},
    {
      enabled: user?.isLoggedIn && referralsEnabled,
      staleTime: Infinity,
      cacheTime: Infinity,
    },
  );
};

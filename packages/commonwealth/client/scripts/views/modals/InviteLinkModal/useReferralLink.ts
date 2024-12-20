import { useFlag } from 'hooks/useFlag';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import {
  useCreateReferralLinkMutation,
  useGetReferralLinkQuery,
} from 'state/api/user';

const useReferralLink = ({ autorun = false }: { autorun?: boolean } = {}) => {
  const referralsEnabled = useFlag('referrals');
  const { data: referralLinkData, isLoading: isLoadingReferralLink } =
    useGetReferralLinkQuery();

  const {
    mutate: createReferralLink,
    mutateAsync: createReferralLinkAsync,
    isLoading: isLoadingCreateReferralLink,
  } = useCreateReferralLinkMutation();

  const referralLink = referralLinkData?.referral_link;

  useRunOnceOnCondition({
    callback: () => createReferralLink({}),
    shouldRun:
      autorun && referralsEnabled && !isLoadingReferralLink && !referralLink,
  });

  const getReferralLink = async () => {
    if (referralLink) {
      return referralLink;
    }

    if (!isLoadingReferralLink && referralsEnabled) {
      const result = await createReferralLinkAsync({});
      return result.referral_link;
    }
  };

  return {
    referralLink,
    getReferralLink,
    isLoadingReferralLink,
    isLoadingCreateReferralLink,
  };
};

export default useReferralLink;

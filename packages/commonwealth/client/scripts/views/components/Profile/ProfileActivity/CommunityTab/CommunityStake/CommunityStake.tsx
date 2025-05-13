import React, { useRef } from 'react';

import { useGetCommunityByIdQuery } from 'client/scripts/state/api/communities';
import { useCommonNavigate } from 'navigation/helpers';
import { useFetchTokenUsdRateQuery } from 'state/api/communityStake/index';
import { useFetchCustomDomainQuery } from 'state/api/configuration';
import useUserStore from 'state/ui/user';
import { trpc } from 'utils/trpcClient';

interface CommunityStakeProps {
  communityId: string;
}

export const CommunityStake = ({ communityId }: CommunityStakeProps) => {
  const navigate = useCommonNavigate();
  const user = useUserStore();
  const { data: domain } = useFetchCustomDomainQuery();

  const { data: community } = useGetCommunityByIdQuery({
    id: communityId,
    includeNodeInfo: true,
  });

  const { data: ethUsdRateData, isLoading: isLoadingEthUsdRate } =
    useFetchTokenUsdRateQuery({
      tokenSymbol: 'ETH',
    });
  const ethUsdRate = ethUsdRateData?.data?.data?.amount;

  const oneDayAgo = useRef(new Date().getTime() - 24 * 60 * 60 * 1000);

  const { data: historicalPrices, isLoading: isLoadingHistoricalPrices } =
    trpc.community.getStakeHistoricalPrice.useQuery({
      past_date_epoch: oneDayAgo.current / 1000,
    });

  console.log('ethUsdRate', ethUsdRate);
  console.log('historicalPrices', historicalPrices);

  return <div className="CommunityStake">Yo</div>;
};

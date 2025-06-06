import React, { useRef } from 'react';

import { ExtendedCommunity } from '@hicommonwealth/schemas';
import { useCommunityCardPrice } from 'client/scripts/hooks/useCommunityCardPrice';
import { useGetCommunityByIdQuery } from 'client/scripts/state/api/communities';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { useFetchTokenUsdRateQuery } from 'state/api/communityStake/index';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod/v4';
import './CommunityStake.scss';

interface CommunityStakeProps {
  communityId: string;
}

export const CommunityStake = ({ communityId }: CommunityStakeProps) => {
  const { data: community } = useGetCommunityByIdQuery({
    id: communityId,
    includeNodeInfo: true,
  });

  const { data: ethUsdRateData } = useFetchTokenUsdRateQuery({
    tokenSymbol: 'ETH',
  });
  const ethUsdRate = ethUsdRateData?.data?.data?.amount;

  const oneDayAgo = useRef(new Date().getTime() - 24 * 60 * 60 * 1000);

  const { data: historicalPrices } =
    trpc.community.getStakeHistoricalPrice.useQuery({
      past_date_epoch: oneDayAgo.current / 1000,
    });

  const { stakeValue } = useCommunityCardPrice({
    community: community as z.infer<typeof ExtendedCommunity>,
    // @ts-expect-error <StrictNullChecks/>
    ethUsdRate,
    stakeId: 2,
    // @ts-expect-error <StrictNullChecks/>
    historicalPrice: historicalPrices,
  });

  return (
    <div className="CommunityStake">
      {stakeValue && (
        <CWText type="b1" className="green-500">
          {stakeValue} ETH
        </CWText>
      )}
    </div>
  );
};

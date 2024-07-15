import 'components/CommunityHomeProfile/CommunityProfile.scss';
import React from 'react';
import app from 'state';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { useCommunityCardPrice } from '../../../hooks/useCommunityCardPrice';
import { useFetchEthUsdRateQuery } from '../../../state/api/communityStake';
import { trpc } from '../../../utils/trpcClient';
import { ImageBehavior } from '../component_kit/cw_cover_image_uploader';
import { CWText } from '../component_kit/cw_text';
import { CWTag } from '../component_kit/new_designs/CWTag';
import CommunityProfileActivity from './CommunityProfileActivity';
import CommunityProfileHeader, {
  ProfileHeaderProps,
} from './CommunityProfileHeader';

const CommunityProfile = () => {
  const chainInfo = app.chain.meta;

  // Fetch ETH/USD rate
  const { data: ethUsdRateData } = useFetchEthUsdRateQuery();
  const ethUsdRate = ethUsdRateData?.data?.data?.amount;

  // Fetch historical price
  const oneDayAgo = React.useRef(new Date().getTime() - 24 * 60 * 60 * 1000);
  const { data: historicalPrices } =
    trpc.community.getStakeHistoricalPrice.useQuery({
      past_date_epoch: oneDayAgo.current / 1000,
    });

  // Get community card price data
  const { stakeEnabled, stakeValue, stakeChange } = useCommunityCardPrice({
    community: chainInfo,
    ethUsdRate: ethUsdRate || '',
    stakeId: 2,
    historicalPrice: historicalPrices?.[chainInfo.id]?.old_price || '',
  });

  const profile = {
    name: chainInfo.name,
    backgroundImage: {
      url: chainInfo.background_image_url || '',
      imageBehavior: ImageBehavior.Fill,
    },
  };

  const profileHeaderProps: ProfileHeaderProps = {
    name: chainInfo.name,
    iconUrl: chainInfo.iconUrl,
    description: chainInfo.description,
    socialLinks: chainInfo.categorizeSocialLinks(),
    threadCount: chainInfo.threadCount,
    addressCount: chainInfo.addressCount,
    defaultSymbol: chainInfo.default_symbol,
    stakeEnabled,
    stakeValue,
    stakeChange,
  };

  return (
    <CWPageLayout>
      <div
        className="Profile"
        style={
          profile.backgroundImage.url
            ? {
                backgroundImage: `url(${profile.backgroundImage.url})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
              }
            : {}
        }
      >
        <div className="header-top">
          <CWText type="h2" fontWeight="medium">
            {`$${profile.name}`}
          </CWText>
          <CWTag
            type="click-to-earn"
            classNames="prize-1"
            label="Click PFP to Earn"
          />
        </div>
        <div
          className={
            profile.backgroundImage.url
              ? 'ProfilePageContainer'
              : 'ProfilePageContainer smaller-margins'
          }
        >
          <CommunityProfileHeader {...profileHeaderProps} />
          <CommunityProfileActivity />
        </div>
      </div>
    </CWPageLayout>
  );
};

export default CommunityProfile;

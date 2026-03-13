import React, { useRef } from 'react';
import { useFlag } from 'shared/hooks/useFlag';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import IdeaLaunchpad from '../ExplorePage/IdeaLaunchpad';
import { TrendingCommunitiesPreview } from '../user_dashboard/TrendingCommunitiesPreview/TrendingCommunitiesPreview';
import HomeDiscoverySections from './HomeDiscoverySections';
import './HomePage.scss';
import HomePageManageCommunityStakeModal from './HomePageManageCommunityStakeModal';
import TrendingTokensList from './TrendingTokenList/TrendingTokenList';
import IOSBanner from './iOSBanner';

const HomePage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mobileDownloadEnabled = useFlag('mobileDownload');

  return (
    <CWPageLayout ref={containerRef} className="ExplorePageLayout">
      <div className="HomePage">
        <div className="header-section">
          <IdeaLaunchpad />
          {mobileDownloadEnabled && <IOSBanner />}
        </div>
        <TrendingTokensList heading="Trending" variant="trending" limit={10} />
        <TrendingTokensList
          heading="Recently Launched"
          variant="recent"
          limit={10}
        />
        <TrendingTokensList
          heading="Graduated"
          variant="graduated"
          limit={10}
        />
        <TrendingCommunitiesPreview />
        <HomeDiscoverySections />
        <HomePageManageCommunityStakeModal />
      </div>
    </CWPageLayout>
  );
};

export default HomePage;

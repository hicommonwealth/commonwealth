import React from 'react';

import 'pages/landing/index.scss';

import type { ChainInfo } from 'models';

import app, { LoginState } from 'state';
import { Header } from './header';
import { CommunitySearch } from './community_search';
import { CreatorsGallery } from './creators_gallery';
import { TokenHolders } from './token_holders';
import { CrowdfundingGallery } from './crowdfunding_gallery';
import UserDashboard from '../user_dashboard';
import { Footer } from '../../footer';
import useForceRerender from 'hooks/useForceRerender';
import { CWText } from '../../components/component_kit/cw_text';
import { Carousel } from './carousel';

// import { MixpanelPageViewEvent } from 'analytics/types';
// import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';

export type Chain = {
  chainInfo: ChainInfo;
  id: string;
  img: string;
  name: string;
  placeholder?: boolean;
};

const sortedChains: Array<Chain> = app.config.chains
  .getAll()
  .sort((a, b) => {
    const threadCountA = app.recentActivity.getCommunityThreadCount(a.id);
    const threadCountB = app.recentActivity.getCommunityThreadCount(b.id);
    return threadCountB - threadCountA;
  })
  .map((chain) => {
    return {
      img: chain.iconUrl,
      id: chain.id,
      chainInfo: chain,
      name: chain.name,
    };
  });

const sortedChainsAndCommunities = sortedChains.filter(
  (c) => !c.chainInfo.collapsedOnHomepage
);

const betaChainsAndCommunities = sortedChains.filter(
  (c) => c.chainInfo.collapsedOnHomepage
);

const chains = [...sortedChainsAndCommunities, ...betaChainsAndCommunities];

const LandingPage = () => {
  const forceRerender = useForceRerender();

  //   if (!app.isLoggedIn()) {
  //     mixpanelBrowserTrack({
  //       event: MixpanelPageViewEvent.LANDING_PAGE_VIEW,
  //       isCustomDomain: app.isCustomDomain(),
  //     });
  //   }
  // }

  if (app.loginState !== LoginState.LoggedIn && !app.isNative(window)) {
    return (
      <div className="LandingPage">
        <Header onLogin={forceRerender} />
        <CommunitySearch chains={chains} />
        <Carousel chains={chains} />
        <CreatorsGallery />
        <TokenHolders />
        <CrowdfundingGallery />
        <div className="join-section">
          <CWText className="join-text" type="h3" fontWeight="semiBold">
            A community for every token.
          </CWText>
          <CWText className="join-text">Join Commonwealth today.</CWText>
        </div>
        <Footer />
      </div>
    );
  } else {
    return <UserDashboard />;
  }
};

export default LandingPage;

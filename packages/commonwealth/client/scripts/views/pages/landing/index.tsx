import React from 'react';

import 'pages/landing/index.scss';

import CommunityInfo from '../../../models/ChainInfo';

import useForceRerender from 'hooks/useForceRerender';
import app, { LoginState } from 'state';
import { Footer } from '../../Footer';
import { CWText } from '../../components/component_kit/cw_text';
import UserDashboard from '../user_dashboard';
import { Carousel } from './carousel';
import { CommunitySearch } from './community_search';
import { CreatorsGallery } from './creators_gallery';
import { CrowdfundingGallery } from './crowdfunding_gallery';
import { Header } from './header';
import { TokenHolders } from './token_holders';

export type Community = {
  communityInfo: CommunityInfo;
  id: string;
  img: string;
  name: string;
  placeholder?: boolean;
};

const sortedCommunities: Array<Community> = app.config.chains
  .getAll()
  .sort((a, b) => {
    const threadCountA = app.recentActivity.getCommunityThreadCount(a.id);
    const threadCountB = app.recentActivity.getCommunityThreadCount(b.id);
    return threadCountB - threadCountA;
  })
  .map((community) => {
    return {
      img: community.iconUrl,
      id: community.id,
      communityInfo: community,
      name: community.name,
    };
  });

const sortedChainsAndCommunities = sortedCommunities.filter(
  (c) => !c.communityInfo.collapsedOnHomepage,
);

const betaChainsAndCommunities = sortedCommunities.filter(
  (c) => c.communityInfo.collapsedOnHomepage,
);

const communities = [
  ...sortedChainsAndCommunities,
  ...betaChainsAndCommunities,
];

const LandingPage = () => {
  const forceRerender = useForceRerender();
  console.log(app.config.chains);

  if (app.loginState !== LoginState.LoggedIn && app.platform() === 'web') {
    return (
      <div className="LandingPage">
        <Header onLogin={forceRerender} />
        <CommunitySearch communities={communities} />
        <Carousel communities={communities} />
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

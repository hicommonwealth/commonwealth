import React from 'react';
import Glide from '@glidejs/glide';

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

export type Token = {
  address: string;
  chainId: number;
  decimals: number;
  logoURI: string;
  name: string;
  symbol: string;
};

const sortedChains = app.config.chains
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

  if (app.loginState !== LoginState.LoggedIn) {
    return (
      <div className="LandingPage">
        <Header onLogin={forceRerender} />
        <CommunitySearch chains={chains} />
        {/* {chains && (
            <Carousel
              oncreateSlider={() => {
                return new (Glide as any)('.glide', {
                  type: 'carousel',
                  focusAt: 'center',
                  perView: 3,
                  gap: 40,
                  autoplay: 3000,
                  hoverpause: true,
                  peek: {
                    before: 100,
                    after: 100,
                  },
                  breakpoints: {
                    1024: {
                      perView: 2,
                      gap: 40,
                    },
                    768: {
                      perView: 2,
                      gap: 20,
                    },
                    640: {
                      perView: 1,
                      gap: 16,
                      peek: {
                        before: 50,
                        after: 50,
                      },
                    },
                  },
                });
              }}
              chains={chains}
            />
          )} */}
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
        <script
          src="https://cdnjs.cloudflare.com/ajax/libs/Glide.js/3.2.0/glide.min.js"
          integrity="sha512-IkLiryZhI6G4pnA3bBZzYCT9Ewk87U4DGEOz+TnRD3MrKqaUitt+ssHgn2X/sxoM7FxCP/ROUp6wcxjH/GcI5Q=="
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/Glide.js/3.2.0/css/glide.core.min.css"
          integrity="sha512-YQlbvfX5C6Ym6fTUSZ9GZpyB3F92hmQAZTO5YjciedwAaGRI9ccNs4iw2QTCJiSPheUQZomZKHQtuwbHkA9lgw=="
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/Glide.js/3.2.0/css/glide.theme.min.css"
          integrity="sha512-wCwx+DYp8LDIaTem/rpXubV/C1WiNRsEVqoztV0NZm8tiTvsUeSlA/Uz02VTGSiqfzAHD4RnqVoevMcRZgYEcQ=="
          crossOrigin="anonymous"
        />
      </div>
    );
  } else {
    return <UserDashboard />;
  }
};

export default LandingPage;

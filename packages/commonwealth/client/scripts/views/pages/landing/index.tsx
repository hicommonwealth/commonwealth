import React from 'react';
import Glide from '@glidejs/glide';

import 'pages/landing/index.scss';

import type { ChainInfo } from 'models';

import app, { LoginState } from 'state';
import { LandingPageHeader } from './landing_page_header';
import { TokensCommunityHero } from './tokens_community_hero';
import { CreatorsCardSection } from './creators_card_section';
import { ChainsSlider } from './chains_slider';
import { FindYourCommunitySection } from './find_your_community_section';
import { CrowdfundingCardSection } from './crowdfunding_card_section';
import UserDashboard from '../user_dashboard';
import { Footer } from '../../footer';
import useForceRerender from 'hooks/useForceRerender';
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
        <LandingPageHeader onLogin={forceRerender} />
        <TokensCommunityHero chains={chains} />
        {/* {chains && (
            <ChainsSlider
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
        <CreatorsCardSection />
        <FindYourCommunitySection />
        <CrowdfundingCardSection
          chains={[
            {
              button: {
                id: 'second-section-button1',
              },
              texts: {
                title: 'Fund new projects',
                text: `Anyone from within your community can easily
                 turn a conversation thread into a Kickstarter-like campaign.`,
              },
              card: {
                id: 'tab-card',
                imgSrc: 'static/img/card1.png',
                imgAlt: '',
              },
            },
            {
              button: {
                id: 'second-section-button2',
              },
              texts: {
                title: 'Create Community Endowments',
                text: `Pool funds with other like-minded folks, and fund
                 interesting projects within your community or across the web.`,
              },
              card: {
                id: 'tab2-card',
                imgSrc: 'static/img/card2.png',
                imgAlt: '',
              },
            },
            {
              button: {
                id: 'second-section-button3',
              },
              texts: {
                title: 'Launch New Tokens',
                text: `Use a project to raise funds for a new DeFi token or NFT.
                 Optionally plug in an allowlist for KYC compliance.`,
              },
              card: {
                id: 'tab3-card',
                imgSrc: 'static/img/card3.png',
                imgAlt: '',
              },
            },
          ]}
        />
        <section className="h-80 bg-gray-900 flex items-center mt-20 h-56">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row md:justify-between">
              <div>
                <h2 className="text-white font-bold text-3xl">
                  A community for every token.
                </h2>
                <p className="text-xl text-gray-400">
                  Join Commonwealth today.
                </p>
              </div>
            </div>
          </div>
        </section>
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

import Glide from '@glidejs/glide';

import { MixpanelPageViewEvent } from 'analytics/types';
import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';
import m from 'mithril';
import type { ChainInfo } from 'models';

// Logged In Homepage View
import 'pages/landing/index.scss';
// Logged Out Homepage View
import 'pages/landing/landing_page.scss';

import app, { LoginState } from 'state';
import { Footer } from '../../footer';

import { handleEmailInvites } from '../../menus/invites_menu';
import UserDashboard from '../user_dashboard';
import TokensChainsComponent from './chains_slider';
import TokensCreatorComponent from './creators_card_section';
import ChainsCrowdfundingComponent from './crowdfunding_card_section';
import TokenHoldersComponent from './find_your_community_section';
import HeaderLandingPage from './landing_page_header';
import JoinCommonWealthSection from './landing_page_pre_footer';
import TokensCommunityComponent from './tokens_community_hero';

export interface Chain {
  img: string;
  id: string;
  name: string;
  placeholder?: boolean;
  chainInfo: ChainInfo;
}

export interface Token {
  address: string;
  chainId: number;
  decimals: number;
  logoURI: string;
  name: string;
  symbol: string;
}

interface IState {
  chains: Chain[];
  hiddenInputTokenList: boolean;
  inputTokenValue: string;
  modalAutoTriggered: boolean;
}

const LandingPage: m.Component<{}, IState> = {
  oncreate: () => {
    if (!app.isLoggedIn()) {
      mixpanelBrowserTrack({
        event: MixpanelPageViewEvent.LANDING_PAGE_VIEW,
        isCustomDomain: app.isCustomDomain(),
      });
    }
  },
  oninit: (vnode) => {
    vnode.state.hiddenInputTokenList = true;
    vnode.state.inputTokenValue = '';
    vnode.state.chains = [];

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

    vnode.state.chains = [
      ...sortedChainsAndCommunities,
      ...betaChainsAndCommunities,
    ];
  },
  view: (vnode) => {
    if (m.route.param('triggerInvite') === 't') {
      setTimeout(() => handleEmailInvites(vnode.state), 0);
    }
    if (app.loginState !== LoginState.LoggedIn) {
      return m('.LandingPage', { class: 'bg-primary' }, [
        m(
          'div',
          { class: 'absolute w-screen z-20' },
          m(HeaderLandingPage, {
            scrollHeader: true,
            navs: [
              { text: 'Why Commonwealth?', redirectTo: '/whyCommonwealth' },
              // { text: 'Use Cases', redirectTo: '/whyCommonwealth' },
              // { text: 'Crowdfunding', redirectTo: '/whyCommonwealth' },
              // { text: 'Developers' },
            ],
          })
        ),
        m(TokensCommunityComponent, { chains: vnode.state.chains }),
        m(TokensChainsComponent, {
          oncreateSlider: () => {
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
          },
          chains: vnode.state.chains,
        }),
        m(TokensCreatorComponent, {
          creators: [
            {
              button: {
                id: 'first-section-button1',
              },
              texts: {
                title: ' On-chain notifications ',
                text:
                  ' Stay up-to-date on chain events like votes and large transfers. ',
              },
              card: {
                id: 'tab-codepen',
                imgSrc: 'static/img/tab1.svg',
                imgAlt: '',
              },
            },
            {
              button: {
                id: 'first-section-button2',
              },
              texts: {
                title: ' Off-chain polling & on-chain voting ',
                text:
                  ' Whether you use Snapshot, COMP governance contracts, or native Layer 1 voting, access' +
                  ' everything from one place. ',
              },
              card: {
                id: 'tab2-codepen',
                imgSrc: 'static/img/tab2.svg',
                imgAlt: '',
              },
            },
            {
              button: {
                id: 'first-section-button3',
              },
              texts: {
                title: ' Crowdfunding ',
                text:
                  ' Fund new tokens and community initiatives with Kickstarter-like raises from a thread. ',
              },
              card: {
                id: 'tab3-codepen',
                imgSrc: 'static/img/tab3.svg',
                imgAlt: '',
              },
            },
            {
              button: {
                id: 'first-section-button4',
              },
              texts: {
                title: ' A rich forum experience ',
                text:
                  ' Discuss memes or key decisions, in a Discourse-style forum. Enhance your posts with' +
                  ' built in Markdown and fun reactions. ',
              },
              card: {
                id: 'tab4-codepen',
                imgSrc: 'static/img/tab4.svg',
                imgAlt: '',
              },
            },
          ],
        }),
        m(TokenHoldersComponent, {
          holders: [
            {
              img: 'static/img/circleCrowd.svg',
              alt: '',
              title: 'Your community is here.',
              text:
                ' Stop bouncing between 10 tabs at once - everything you need to know about your token is here. ',
            },
            {
              img: 'static/img/1stButtonToken.svg',
              alt: '',
              title: 'Claim your token',
              text:
                ' We generate pages for your favorite community and address from real-time chain activity.' +
                ' Claim yours. ',
            },
            {
              img: 'static/img/bell.svg',
              alt: '',
              title: 'Stay updated',
              text:
                ' Be the first to know when community events are happening with in-app, email, and mobile' +
                ' push notifications. ',
            },
            {
              img: 'static/img/calendar.svg',
              alt: '',
              title: 'Participate in events.',
              text:
                ' Participate in events like upcoming votes, new projects and community initiatives. ',
            },
          ],
        }),
        m(ChainsCrowdfundingComponent, {
          chains: [
            {
              button: {
                id: 'second-section-button1',
              },
              texts: {
                title: 'Fund new projects',
                text:
                  'Anyone from within your community can easily turn a conversation thread into a' +
                  ' Kickstarter-like campaign. ',
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
                text:
                  ' Pool funds with other like-minded folks, and fund interesting projects within' +
                  ' your community or across the web. ',
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
                text:
                  ' Use a project to raise funds for a new DeFi token or NFT.' +
                  ' Optionally plug in an allowlist for KYC compliance. ',
              },
              card: {
                id: 'tab3-card',
                imgSrc: 'static/img/card3.png',
                imgAlt: '',
              },
            },
          ],
        }),
        m(JoinCommonWealthSection),
        m(Footer),
        m('script', {
          src:
            'https://cdnjs.cloudflare.com/ajax/libs/Glide.js/3.2.0/glide.min.js',
          integrity:
            'sha512-IkLiryZhI6G4pnA3bBZzYCT9Ewk87U4DGEOz+TnRD3MrKqaUitt+ssHgn2X/sxoM7FxCP/ROUp6wcxjH/GcI5Q==',
          crossorigin: 'anonymous',
        }),
        m('link', {
          rel: 'stylesheet',
          href:
            'https://cdnjs.cloudflare.com/ajax/libs/Glide.js/3.2.0/css/glide.core.min.css',
          integrity:
            'sha512-YQlbvfX5C6Ym6fTUSZ9GZpyB3F92hmQAZTO5YjciedwAaGRI9ccNs4iw2QTCJiSPheUQZomZKHQtuwbHkA9lgw==',
          crossorigin: 'anonymous',
        }),
        m('link', {
          rel: 'stylesheet',
          href:
            'https://cdnjs.cloudflare.com/ajax/libs/Glide.js/3.2.0/css/glide.theme.min.css',
          integrity:
            'sha512-wCwx+DYp8LDIaTem/rpXubV/C1WiNRsEVqoztV0NZm8tiTvsUeSlA/Uz02VTGSiqfzAHD4RnqVoevMcRZgYEcQ==',
          crossorigin: 'anonymous',
        }),
      ]);
    } else {
      return m(UserDashboard);
    }
  },
};

export default LandingPage;

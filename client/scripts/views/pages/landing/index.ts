import m from 'mithril';
import './landing_page.scss';
import Glide from '@glidejs/glide';

import HeaderLandingPage from './header';
import FooterLandingPage from './footer';
import TokensCommunityComponent from './tokensCommunity';
import TokensCreatorComponent from './tokensCreators';
import TokensChainsComponent from './tokensChains';
import JoinCommonWealthSection from './joinCommonWealth';
import TokenHoldersComponent from './tokensHolder';
import ChainsCrowdfundingComponent from './chainsCrowdfunding';

const LandingPage: m.Component<{}, {}> = {
  view: (vnode) => {
    return m('.LandingPage', { class: 'bg-primary' }, [
      m(
        'div',
        { class: 'absolute w-screen z-20 mt-8' },
        m(HeaderLandingPage, {
          navs: [
            { text: 'Why Commonwealth?', ref: '' },
            { text: 'Use Cases', ref: '' },
            { text: 'Crowdfunding', ref: '' },
            { text: 'Developers', ref: '' },
          ],
        })
      ),
      m(TokensCommunityComponent),
      m(TokensChainsComponent, {
        oncreateSlider: () => {
          const glide = new (Glide as any)('.glide', {
            type: 'carousel',
            focusAt: 'center',
            perView: 3,
            gap: 40,
            autoplay: 0,
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
          glide.mount();
        },
        chains: [
          {
            img: 'static/img/near-protocol.png',
            title: 'NEAR Protocol',
            content: ' High-performance platform for dapps with foccus on UX ',
          },
          {
            img: 'static/img/edgeware.svg',
            title: 'Edgeware',
            content: ' Next generation smart contracts ',
          },
          {
            img: 'static/img/straightedge.svg',
            title: 'Straightedge',
            content: ' A Cosmic smart contracting platform ',
          },
        ],
      }),
      m(TokensCreatorComponent, {
        creators: [
          {
            button: {
              id: 'first-section-button1',
            },
            texts: {
              id: 'tab-codepen-text',
              title: ' On-chain notifications ',
              text:
                ' Your token holders can stay up-to-date on chain events like votes and large transfers ',
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
              id: 'tab2-codepen-text',
              title: ' Off-chain polling & On-chain voting ',
              text:
                ' Whether your community uses Snapshot, Comp Governance, or native layer 1. Access everything from one place. ',
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
              id: 'tab3-codepen-text',
              title: ' Crowdfunding protocols ',
              text:
                ' Fund new tokens and community initiatives with Kickstarter-like raises from a thread ',
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
              id: 'tab4-codepen-text',
              title: ' A rich forum experience ',
              text:
                ' Discuss memes and important topics alike in a Discourse-style forum. Enhance your posts with built in Markdown and fun reactions. ',
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
              ' We generate pages for your favorite community and address from real-time chain actvity. Claim yours. ',
          },
          {
            img: 'static/img/bell.svg',
            alt: '',
            title: 'Stay updated',
            text:
              ' Be the first to know when community events are happening with in-app, email, and mobile push notiications. ',
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
              title: 'Fund new projects',
              card: {
                text:
                  ' Anyone from within your community can easily turn a conversation thread into a Kickstarter-like campaign ',
                id: 'tab-card-text',
              },
            },
            card: {
              id: 'tab-card',
              src: 'static/img/card1.png',
              alt: '',
            },
          },
          {
            button: {
              id: 'second-section-button2',
              title: ' Create Community Endowments ',
              card: {
                text:
                  ' Lets you pool funds with other like minded folks and fund interesting projects within your community or across the web[need better word] ',
                id: 'tab2-card-text',
              },
            },
            card: {
              id: 'tab2-card',
              src: 'static/img/card2.png',
              alt: '',
            },
          },
          {
            button: {
              id: 'second-section-button3',
              title: 'Launch New Tokens',
              card: {
                text:
                  ' Use a project to raise funds for a new tokenize DeFi or NFT token and optionally plug in an allowlist for KYC compliance ',
                id: 'tab3-card-text',
              },
            },
            card: {
              id: 'tab3-card',
              src: 'static/img/card3.png',
              alt: '',
            },
          },
        ],
      }),
      m(JoinCommonWealthSection),
      m(FooterLandingPage, {
        list: [
          { text:  'Why Commonwealth?', href: '' },
          { text:  'Use Cases', href: '' },
          { text:  'Crowdfunding', href: '' },
          { text:  'Developers', href: '' },
          { text:  'About us', href: '' },
          { text:  'Carrers', href: '' }
        ]
      }),
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
  },
};

export default LandingPage;

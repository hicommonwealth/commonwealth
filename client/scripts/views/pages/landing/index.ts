import m from 'mithril';

// move properly into components or the desired folder
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
    return m('div', {}, [
      m('div', { class: 'absolute w-screen z-20 mt-8' }, m(HeaderLandingPage)),
      m(TokensCommunityComponent),
      m(TokensChainsComponent),
      m(TokensCreatorComponent),
      m(TokenHoldersComponent),
      m(ChainsCrowdfundingComponent),
      m(JoinCommonWealthSection),
      m(FooterLandingPage),
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

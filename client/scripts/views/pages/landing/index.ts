import m from 'mithril';
import Sublayout from 'views/sublayout';

// move properly into components or the desired folder
import HeaderLandingPage from './header';
import FooterLandingPage from './footer';
import TokensCommunityComponent from './tokensCommunity';
import TokensCreatorComponent from './tokensCreators';
import TokensChainsComponent from './tokensChains';
import JoinCommonWealthSection from './joinCommonWealth';
import TokenHoldersComponent from './tokensHolder';
import ChainsCrowdfundingComponent from './chainsCrowdfunding';
// Extract the logic from the html in order to make it reusables and small pieaces of code
// WIP REFACTOR OF THE COMPONENTS


const LandingPage: m.Component<{}, {}> = {
  view: (vnode) => {
    return m(
    // maybe this sublayout is not needed?
      Sublayout,
      {},
      [
        m(
          'div',
          { class: 'absolute w-screen z-20' },
          m(
            'div',
            { class: 'mt-8 container mx-auto' },
            m(HeaderLandingPage)
          )
        ),
        // parent component (section) inside the component or on the first layer?
        m(TokensCommunityComponent),
        m(TokensChainsComponent),
        m(TokensCreatorComponent),
        m(TokenHoldersComponent),
        m(ChainsCrowdfundingComponent),
        m(JoinCommonWealthSection),
        m(FooterLandingPage),
        // install glide dependency or insert it in first layer
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
        // should translate into components
        // m(
        //   'script',
        //   " const ALL_TABS = { 1: 'tab-codepen', 2: 'tab2-codepen', 3: 'tab3-codepen', 4: 'tab4-codepen', } const BUTTONS_TABS = { 1: 'button-tab-codepen1', 2: 'button-tab-codepen2', 3: 'button-tab-codepen3', 4: 'button-tab-codepen4', } const ALL_CARDS_TABS = { 1: 'tab-card', 2: 'tab2-card', 3: 'tab3-card', } const BUTTONS_CARDS_TABS = { 1: 'tab-card-button', 2: 'tab2-card-button', 3: 'tab3-card-button', } const resetTabs = tabs => { tabs.forEach(tab => { var tabTextId = tab + '-text' document.getElementById(tab).style.visibility = 'hidden' document.getElementById(tabTextId).style.visibility = 'hidden' }) } const resetHoverButtons = (buttons, style) => buttons.forEach(button => document.getElementById(button).classList.remove(style)) resetTabs([ALL_TABS[2], ALL_TABS[3], ALL_TABS[4]]) resetTabs([ALL_CARDS_TABS[2], ALL_CARDS_TABS[3]]) var changeTokenCreatorsTab = (tab) => { resetTabs([ALL_TABS[1], ALL_TABS[2], ALL_TABS[3], ALL_TABS[4]]) var tabId = document.getElementById(ALL_TABS[tab]) var tabTextId = document.getElementById(ALL_TABS[tab] + '-text') var buttonClicked = document.getElementById(BUTTONS_TABS[tab]) resetHoverButtons([BUTTONS_TABS[1], BUTTONS_TABS[2], BUTTONS_TABS[3], BUTTONS_TABS[4]], 'bg-gray-800') buttonClicked.classList.add('bg-gray-800') tabId.style.visibility = 'visible' tabTextId.style.visibility = 'visible' } var changeCrowdfundingTab = (tab) => { resetTabs([ALL_CARDS_TABS[1], ALL_CARDS_TABS[2], ALL_CARDS_TABS[3]]) var tabId = document.getElementById(ALL_CARDS_TABS[tab]) var tabTextId = document.getElementById(ALL_CARDS_TABS[tab] + '-text') var buttonClicked = document.getElementById(BUTTONS_CARDS_TABS[tab]) resetHoverButtons([BUTTONS_CARDS_TABS[1], BUTTONS_CARDS_TABS[2], BUTTONS_CARDS_TABS[3]], 'bg-gray-100') buttonClicked.classList.add('bg-gray-100') tabId.style.visibility = 'visible' tabTextId.style.visibility = 'visible' } var glide = new Glide(\".glide\", { type: \"carousel\", focusAt: \"center\", perView: 3, gap: 40, autoplay: 0, hoverpause: true, peek: { before: 100, after: 100, }, breakpoints: { 1024: { perView: 2, gap: 40, }, 768: { perView: 2, gap: 20, }, 640: { perView: 1, gap: 16, peek: { before: 50, after: 50, }, }, }, }); glide.mount(); "
        // ),
      ]
    );
  },
};

export default LandingPage;

import m from 'mithril';
// Logged Out Homepage View
import 'pages/landing/landing_page.scss';
import Glide from '@glidejs/glide';

import app, { LoginState } from 'state';

import { ChainInfo } from 'client/scripts/models';
import Sublayout from 'views/sublayout';
import HeaderLandingPage from './landing_page_header';
import FooterLandingPage from './landing_page_footer';
import JoinCommonWealthSection from './landing_page_pre_footer';
import TokensCommunityComponent from './tokens_community_hero';
import TokensCreatorComponent from './creators_card_section';
import TokensChainsComponent from './chains_slider';
import TokenHoldersComponent from './find_your_community_section';
import ChainsCrowdfundingComponent from './crowdfunding_card_section';

// Logged In Homepage View
import 'pages/landing/index.scss';

import CommunityCards from './community_cards';
import { handleEmailInvites } from '../../components/header/invites_menu';
import StaticLandingPage from './landing_page';

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
  oninit: (vnode) => {
    vnode.state.hiddenInputTokenList = true;
    vnode.state.inputTokenValue = '';
    vnode.state.chains = [];

    const chains = {};
    app.config.nodes.getAll().forEach((n) => {
      if (chains[n.chain.id]) {
        chains[n.chain.id].push(n);
      } else {
        chains[n.chain.id] = [n];
      }
    });

    const myChains: any = Object.entries(chains);
    const myCommunities: any = app.config.communities.getAll();
    const sortChains = (list: any[]) => list
      .sort((a, b) => {
        const threadCountA = app.recentActivity.getCommunityThreadCount(
          Array.isArray(a) ? a[0] : a.id
        );
        const threadCountB = app.recentActivity.getCommunityThreadCount(
          Array.isArray(b) ? b[0] : b.id
        );
        return threadCountB - threadCountA;
      })
    // eslint-disable-next-line array-callback-return
      .map((entity) => {
        if (Array.isArray(entity)) {
          const [chain, nodeList]: [string, any] = entity as any;
          const chainInfo = nodeList[0].chain;
          return {
            img: chainInfo.iconUrl,
            id: chain,
            chainInfo,
            name: chainInfo.name,
          };
        } else  {
          // Should never be used
          return {
            img: entity.defaultChain.iconUrl,
            id: entity.id,
            chainInfo: entity.defaultChain,
            description: entity.description,
            name: entity.defaultChain.name,
          };
        }
      })
      .filter((chain: any) => chain);

    const sortedChainsAndCommunities = sortChains(
      myChains
        .filter((c) => c[1][0] && !c[1][0].chain.collapsedOnHomepage)
    );
    const betaChainsAndCommunities = sortChains(
      myChains
        .filter((c) => c[1][0] && c[1][0].chain.collapsedOnHomepage)
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
      return m(StaticLandingPage);
    } else {
      return m(Sublayout, {
        class: 'Homepage',
      }, [
        m(CommunityCards),
      ]);
    }
  }
};

export default LandingPage;

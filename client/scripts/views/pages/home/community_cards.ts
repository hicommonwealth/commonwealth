import 'pages/home/community_cards.scss';

import { default as m } from 'mithril';
import { link } from 'helpers';
import ChainIcon from 'views/components/chain_icon';
import MembershipButton, { isMember } from 'views/components/membership_button';
import app from 'state';
import { Button, Card, Icons } from 'construct-ui';

const ChainCard : m.Component<{ chain, nodeList, justJoinedChains }> = {
  view: (vnode) => {
    const { chain, nodeList, justJoinedChains } = vnode.attrs;
    const visitedChain = !!app.login.unseenPosts[chain];
    const updatedThreads = app.login.unseenPosts[chain]?.activePosts || 0;

    return m(Card, {
      class: 'home-card',
      fluid: true,
      elevation: 1,
    }, [
      m(ChainIcon, { chain: nodeList[0].chain }),
      m('h3', chain.charAt(0).toUpperCase() + chain.substring(1)),
      isMember(chain, null) && justJoinedChains.indexOf(chain) === -1 && [
        app.isLoggedIn() && !visitedChain && m('.chain-new', m('.new-threads', 'New')),
        updatedThreads > 0 && m('.chain-new', m('.new-threads', `${updatedThreads} new`)),
      ],
      m(Button, {
        interactive: true,
        compact: true,
        size: 'sm',
        onclick: (e) => m.route.set(`/${chain}`),
        label: 'Visit'
      }),
      app.isLoggedIn() && m('.chain-membership', [
        m(MembershipButton, {
          chain,
          onMembershipChanged: (created) => {
            if (created && !isMember(chain, null)) justJoinedChains.push(chain);
          }
        })
      ]),
    ]);
  }
};

const CommunityCard : m.Component<{ community, justJoinedCommunities }> = {
  view: (vnode) => {
    const { justJoinedCommunities } = vnode.attrs;
    const c = vnode.attrs.community;
    const visitedCommunity = !!app.login.unseenPosts[c.id];
    const updatedThreads = app.login.unseenPosts[c.id]?.activePosts || 0;
    return m(Card, {
      class: 'home-card',
      fluid: true,
      elevation: 1,
    }, [
      m('h3', [
        c.name,
        c.privacyEnabled && m('span.icon-lock'),
      ]),
      isMember(null, c.id) && justJoinedCommunities.indexOf(c.id) === -1 && [
        app.isLoggedIn() && !visitedCommunity && m('.chain-new', m('.new-threads', 'New')),
        updatedThreads > 0 && m('.chain-new', m('.new-threads', `${updatedThreads} new`)),
      ],
      m(Button, {
        interactive: true,
        compact: true,
        size: 'sm',
        onclick: (e) => m.route.set(`/${c.id}`),
        label: 'Visit'
      }),
      app.isLoggedIn() && [
        m(MembershipButton, {
          community: c.id,
          onMembershipChanged: (created) => {
            if (created && !isMember(null, c.id)) justJoinedCommunities.push(c.id);
          }
        })
      ],
    ]);
  }
};

const LinkCard = {
  view: (vnode) => {
    return m(Card, {
      class: 'home-card',
      interactive: true,
      fluid: true,
      elevation: 1,
      onclick: (e) => m.route.set(vnode.attrs.target),
    }, [
      m('h3', vnode.attrs.title)
    ]);
  }
};

const HomepageCommunityCards: m.Component<{}, { justJoinedChains, justJoinedCommunities }> = {
  oninit: (vnode) => {
    vnode.state.justJoinedChains = [];
    vnode.state.justJoinedCommunities = [];
  },
  view: (vnode) => {
    const { justJoinedChains, justJoinedCommunities } = vnode.state;
    const chains = {};
    app.config.nodes.getAll().forEach((n) => {
      if (chains[n.chain.network]) {
        chains[n.chain.network].push(n);
      } else {
        chains[n.chain.network] = [n];
      }
    });

    let myChains;
    let myCommunities;
    let otherChains;
    let otherCommunities;
    if (!app.isLoggedIn()) {
      myChains = [];
      myCommunities = [];
      otherChains = Object.entries(chains);
      otherCommunities = app.config.communities.getAll();
    } else {
      myChains = Object.entries(chains)
        .filter(([c, nodeList]) => isMember(c, null) && vnode.state.justJoinedChains.indexOf(c) === -1);

      myCommunities = app.config.communities.getAll()
        .filter((c) => isMember(null, c.id) && vnode.state.justJoinedCommunities.indexOf(c.id) === -1);

      otherChains = Object.entries(chains)
        .filter(([c, nodeList]) => !isMember(c, null) || vnode.state.justJoinedChains.indexOf(c) !== -1);

      otherCommunities = app.config.communities.getAll()
        .filter((c) => !isMember(null, c.id) || vnode.state.justJoinedCommunities.indexOf(c.id) !== -1);
    }

    return m('.HomepageCommunityCards', [
      m('h2', 'Find a public community'),
      m('.communities-list', [
        myChains.map(([chain, nodeList] : [string, any]) => m(ChainCard, { chain, nodeList, justJoinedChains })),
        myCommunities.map((community) => m(CommunityCard, { community, justJoinedCommunities })),
        otherChains.map(([chain, nodeList] : [string, any]) => m(ChainCard, { chain, nodeList, justJoinedChains })),
        otherCommunities.map((community) => m(CommunityCard, { community, justJoinedCommunities })),
      ]),
      // other
      m(LinkCard, { title: 'Edgeware Lockdrop Statistics', target: '/edgeware/stats' }),
      m(LinkCard, { title: 'Edgeware Lockdrop Unlock', target: '/unlock', }),
      m('.clear'),
    ]);
  }
};

export default HomepageCommunityCards;

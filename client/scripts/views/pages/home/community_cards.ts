import 'pages/home/community_cards.scss';

import { default as m } from 'mithril';
import { link } from 'helpers';
import ChainIcon from 'views/components/chain_icon';
import MembershipButton, { isMember } from 'views/components/membership_button';
import app from 'state';
import { Button, Icons } from 'construct-ui';

const ChainCard : m.Component<{ chain, nodeList, justJoinedChains }> = {
  view: (vnode) => {
    const { chain, nodeList, justJoinedChains } = vnode.attrs;
    const chainInfo = app.config.chains.getById(chain);
    const visitedChain = !!app.login.unseenPosts[chain];
    const updatedThreads = app.login.unseenPosts[chain]?.activePosts || 0;

    return m('.home-card', [
      // m(ChainIcon, { chain: nodeList[0].chain }),
      m('h3', chainInfo.name),
      isMember(chain, null) && justJoinedChains.indexOf(chain) === -1 && [
        app.isLoggedIn() && !visitedChain && m('.chain-new', m('.new-threads', 'New')),
        updatedThreads > 0 && m('.chain-new', m('.new-threads', `${updatedThreads} new`)),
      ],
      m('p.card-description', chainInfo.description),
      m(Button, {
        interactive: true,
        compact: true,
        size: 'sm',
        intent: 'primary',
        onclick: (e) => m.route.set(`/${chain}`),
        label: m.trust('Go to community &rarr;')
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

    return m('.home-card', [
      m('h3', [
        c.name,
        c.privacyEnabled && m('span.icon-lock'),
      ]),
      isMember(null, c.id) && justJoinedCommunities.indexOf(c.id) === -1 && [
        app.isLoggedIn() && !visitedCommunity && m('.chain-new', m('.new-threads', 'New')),
        updatedThreads > 0 && m('.chain-new', m('.new-threads', `${updatedThreads} new`)),
      ],
      m('p.card-description', c.description),
      m(Button, {
        interactive: true,
        compact: true,
        size: 'sm',
        intent: 'primary',
        onclick: (e) => m.route.set(`/${c.id}`),
        label: m.trust('Go to community &rarr;'),
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
    return m('.home-card', [
      m('h3', vnode.attrs.title),
      m(Button, {
        interactive: true,
        compact: true,
        size: 'sm',
        intent: 'primary',
        onclick: (e) => m.route.set(vnode.attrs.target),
        label: m.trust(`${vnode.attrs.link} &rarr;`),
      }),
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
      m(LinkCard, { title: 'Edgeware Lockdrop Statistics', link: 'Go to statistics', target: '/edgeware/stats' }),
      m(LinkCard, { title: 'Edgeware Lockdrop Unlock Tool', link: 'Go to unlock tool', target: '/unlock', }),
      m('.clear'),
    ]);
  }
};

export default HomepageCommunityCards;

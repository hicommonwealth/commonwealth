import 'pages/home/community_cards.scss';

import m from 'mithril';
import { Button, Icons } from 'construct-ui';

import app from 'state';
import { ChainIcon, CommunityIcon } from 'views/components/chain_icon';
import MembershipButton from 'views/components/membership_button';

const ChainCard : m.Component<{ chain, nodeList, justJoinedChains }> = {
  view: (vnode) => {
    const { chain, nodeList, justJoinedChains } = vnode.attrs;
    const chainInfo = app.config.chains.getById(chain);
    const visitedChain = !!app.user.unseenPosts[chain];
    const updatedThreads = app.user.unseenPosts[chain]?.activePosts || 0;

    return m('.home-card', [
      m(ChainIcon, { chain: nodeList[0].chain }),
      m('h3', chainInfo.name),
      app.user.isMember({ account: app.user.activeAccount, chain: chain as string, }) && justJoinedChains.indexOf(chain) === -1 && [
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
      // app.isLoggedIn() && m('.chain-membership', [
      //   m(MembershipButton, {
      //     chain,
      //     onMembershipChanged: (created) => {
      //       if (created && !isMember(chain, null)) justJoinedChains.push(chain);
      //     }
      //   })
      // ]),
    ]);
  }
};

const CommunityCard : m.Component<{ community, justJoinedCommunities }> = {
  view: (vnode) => {
    const { justJoinedCommunities, community } = vnode.attrs;
    const visitedCommunity = !!app.user.unseenPosts[community.id];
    const updatedThreads = app.user.unseenPosts[community.id]?.activePosts || 0;

    return m('.home-card', [
      m(CommunityIcon, { community }),
      m('h3', [
        community.name,
        community.privacyEnabled && m('span.icon-lock'),
      ]),
      app.user.isMember({ account: app.user.activeAccount, community: community.id}) && justJoinedCommunities.indexOf(community.id) === -1 && [
        app.isLoggedIn() && !visitedCommunity && m('.chain-new', m('.new-threads', 'New')),
        updatedThreads > 0 && m('.chain-new', m('.new-threads', `${updatedThreads} new`)),
      ],
      m('p.card-description', community.description),
      m(Button, {
        interactive: true,
        compact: true,
        size: 'sm',
        intent: 'primary',
        onclick: (e) => m.route.set(`/${community.id}`),
        label: m.trust('Go to community &rarr;'),
      }),
      // app.isLoggedIn() && [
      //   m(MembershipButton, {
      //     community: community.id,
      //     onMembershipChanged: (created) => {
      //       if (created && !isMember(null, community.id)) justJoinedCommunities.push(community.id);
      //     }
      //   })
      // ],
    ]);
  }
};

const LockdropToolsCard = {
  view: (vnode) => {
    return m('.LockdropToolsCard.home-card', [
      m('h3', 'Edgeware Lockdrop Tools'),
      m(Button, {
        interactive: true,
        compact: true,
        size: 'sm',
        intent: 'primary',
        onclick: (e) => m.route.set('/edgeware/stats'),
        label: m.trust('Lockdrop stats &rarr;'),
      }),
      m(Button, {
        interactive: true,
        compact: true,
        size: 'sm',
        intent: 'primary',
        onclick: (e) => m.route.set('/edgeware/unlock'),
        label: m.trust('Unlock tool &rarr;'),
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
      if (chains[n.chain.id]) {
        chains[n.chain.id].push(n);
      } else {
        chains[n.chain.id] = [n];
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
        .filter(([c, nodeList]) => app.user.isMember({ account: app.user.activeAccount, chain: c }) && vnode.state.justJoinedChains.indexOf(c) === -1);

      myCommunities = app.config.communities.getAll()
        .filter((c) => app.user.isMember({ account: app.user.activeAccount, community: c.id }) && vnode.state.justJoinedCommunities.indexOf(c.id) === -1);

      otherChains = Object.entries(chains)
        .filter(([c, nodeList]) => !app.user.isMember({ account: app.user.activeAccount, chain: c }) || vnode.state.justJoinedChains.indexOf(c) !== -1);

      otherCommunities = app.config.communities.getAll()
        .filter((c) => !app.user.isMember({ account: app.user.activeAccount, community: c.id }) || vnode.state.justJoinedCommunities.indexOf(c.id) !== -1);
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
      m(LockdropToolsCard),
      m('.clear'),
    ]);
  }
};

export default HomepageCommunityCards;

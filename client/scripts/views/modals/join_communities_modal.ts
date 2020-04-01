import 'modals/join_communities_modal.scss';

import { default as m } from 'mithril';
import { link } from 'helpers';
import ChainIcon from 'views/components/chain_icon';
import MembershipButton, { isMember } from 'views/components/membership_button';
import app from 'state';

const ChainCard : m.Component<{ chain, nodeList, justJoinedChains }> = {
  view: (vnode) => {
    const { chain, nodeList, justJoinedChains } = vnode.attrs;
    const visitedChain = !!app.login.unseenPosts[chain];
    const newThreads = app.login.unseenPosts[chain]?.threads ? app.login.unseenPosts[chain]?.threads : 0;
    return link('a.home-card.ChainCard', `/${chain}/`, [
      m(ChainIcon, { chain: nodeList[0].chain }),
      m('.chain-info', [
        m('h3', chain.charAt(0).toUpperCase() + chain.substring(1)),
        m('p', nodeList[0].chain.description),
      ]),
      isMember(chain, null) && justJoinedChains.indexOf(chain) === -1 && [
        app.isLoggedIn() && !visitedChain && m('.chain-new', m('.new-threads', `New`)),
        newThreads > 0 && m('.chain-new', m('.new-threads', `${newThreads} new`)),
      ],
      app.isLoggedIn() && m('.chain-membership', [
        m(MembershipButton, {
          chain: chain,
          onMembershipChanged: (created) => {
            if (created) justJoinedChains.push(chain);
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
    const newThreads = app.login.unseenPosts[c.id]?.threads ? app.login.unseenPosts[c.id]?.threads : 0;
    return link('a.home-card.CommunityCard', `/${c.id}/`, [
      m('.community-icon', [
        m('span.icon-network'),
      ]),
      m('.community-info', [
        m('h3', [
          c.name,
          c.privacyEnabled && m('span.community-privacy', [
            m('span.icon-lock'),
          ]),
        ]),
        m('p', c.description),
      ]),
      isMember(null, c.id) && justJoinedCommunities.indexOf(c.id) === -1 && [
        app.isLoggedIn() && !visitedCommunity && m('.chain-new', m('.new-threads', `New`)),
        newThreads > 0 && m('.chain-new', m('.new-threads', `${newThreads} new`)),
      ],
      app.isLoggedIn() && !c.privacyEnabled && m('.chain-membership', [
        m(MembershipButton, {
          community: c.id,
          onMembershipChanged: (created) => {
            if (created) justJoinedCommunities.push(c.id);
          }
        })
      ]),
      app.isLoggedIn() && c.privacyEnabled && m('.chain-membership', [
        m('a.btn.btn-block.disabled.MembershipButton', 'Joined ✓')
      ]),
    ]);
  }
};

export const JoinCommunitiesContent: m.Component<{ showLockdropContent }, { justJoinedChains, justJoinedCommunities }> = {
  oninit: (vnode) => {
    vnode.state.justJoinedChains = [];
    vnode.state.justJoinedCommunities = [];
  },
  view: (vnode) => {
    const { justJoinedChains, justJoinedCommunities } = vnode.state;
    const chains = {};
    app.config.nodes.getAll().forEach((n) => {
      chains[n.chain.network] ? chains[n.chain.network].push(n) : chains[n.chain.network] = [n];
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

    return m('.JoinCommunitiesContent', [

      // chains and communities
      (myChains.length > 0 || myCommunities.length > 0) && [
        m('h3.category-name', 'My Communities'),
        m('.communities', [
          myChains.map(([chain, nodeList] : [string, any]) => m(ChainCard, { chain, nodeList, justJoinedChains })),
          myCommunities.map((community) => m(CommunityCard, { community, justJoinedCommunities })),
        ]),
        m('.clear'),
      ],
      m('h3.category-name', [
        (myChains.length > 0 || myCommunities.length > 0) ? 'More Communities' : 'Commmunities'
      ]),
      m('.communities', [
        otherChains.map(([chain, nodeList] : [string, any]) => m(ChainCard, { chain, nodeList, justJoinedChains })),
        otherCommunities.map((community) => m(CommunityCard, { community, justJoinedCommunities })),
      ]),
      m('.clear'),

      // other
      vnode.attrs.showLockdropContent && [
        m('h3.category-name', 'Other'),
        m('.communities', [
          link('a.home-card.half', '/edgeware/stats', [
            m('.event-info', [
              m('h3', 'Edgeware Lockdrop Statistics'),
            ]),
          ]),
          link('a.home-card.half', '/unlock', [
            m('.event-info', [
              m('h3', 'Edgeware Lockdrop Unlock'),
            ]),
          ]),
          !app.isProduction() && link('a.home-card.half', '/supernova', [
            m('.event-info', [
              m('h3', 'Supernova Lockdrop'),
            ]),
          ]),
        ]),
        m('.clear'),
      ],
    ]);
  }
};

const JoinCommunitiesModal = {
  view: (vnode) => {
    return m('.JoinCommunitiesModal', [
      m(JoinCommunitiesContent, { showLockdropContent: false }),
    ]);
  }
};

export default JoinCommunitiesModal;

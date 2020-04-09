import 'components/homepage_communities.scss';

import { default as m } from 'mithril';
import { link } from 'helpers';
import ChainIcon from 'views/components/chain_icon';
import MembershipButton, { isMember } from 'views/components/membership_button';
import app from 'state';
import { Button, Card, Icons } from 'construct-ui';

const VisitButton: m.Component<{ chain?, community? }> = {
  view: (vnode) => {
    const { chain, community } = vnode.attrs;
    if (!chain && !community) return;

    return m(Button, {
      class: 'VisitButton',
      onclick: (e) => {
        if (community) {
          m.route.set(community);
        } else {
          m.route.set(chain);
        }
      },
      iconLeft: Icons.CHEVRON_RIGHT,
      label: isMember(chain, community) ? 'Visit' : 'Preview',
      size: 'xs',
    });
  }
};

const ChainCard : m.Component<{ chain, nodeList, justJoinedChains, disableNavigation }> = {
  view: (vnode) => {
    const { chain, nodeList, justJoinedChains, disableNavigation } = vnode.attrs;
    const visitedChain = !!app.login.unseenPosts[chain];
    const newThreads = app.login.unseenPosts[chain]?.threads ? app.login.unseenPosts[chain]?.threads : 0;

    return m(Card, {
      class: 'home-card',
      interactive: !disableNavigation,
      fluid: true,
      elevation: 1,
      onclick: disableNavigation ? null : (e) => m.route.set(`/${chain}/`),
    }, [
      m(ChainIcon, { chain: nodeList[0].chain }),
      m('h3', chain.charAt(0).toUpperCase() + chain.substring(1)),
      isMember(chain, null) && justJoinedChains.indexOf(chain) === -1 && [
        app.isLoggedIn() && !visitedChain && m('.chain-new', m('.new-threads', `New`)),
        newThreads > 0 && m('.chain-new', m('.new-threads', `${newThreads} new`)),
      ],
      app.isLoggedIn() && m('.chain-membership', [
        m(VisitButton, { chain }),
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

const CommunityCard : m.Component<{ community, justJoinedCommunities, disableNavigation }> = {
  view: (vnode) => {
    const { justJoinedCommunities, disableNavigation } = vnode.attrs;
    const c = vnode.attrs.community;
    const visitedCommunity = !!app.login.unseenPosts[c.id];
    const newThreads = app.login.unseenPosts[c.id]?.threads ? app.login.unseenPosts[c.id]?.threads : 0;
    return m(Card, {
      class: 'home-card',
      interactive: !disableNavigation,
      fluid: true,
      elevation: 1,
      onclick: disableNavigation ? null : (e) => m.route.set(`/${c.id}/`),
    }, [
      m('h3', [
        c.name,
        c.privacyEnabled && m('span.icon-lock'),
      ]),
      isMember(null, c.id) && justJoinedCommunities.indexOf(c.id) === -1 && [
        app.isLoggedIn() && !visitedCommunity && m('.chain-new', m('.new-threads', `New`)),
        newThreads > 0 && m('.chain-new', m('.new-threads', `${newThreads} new`)),
      ],
      app.isLoggedIn() && [
        m(VisitButton, { community: c.id }),
        // This is weird, but the weird will be fixed after Roles and Memberships are merged
        (c.privacyEnabled && isMember(null, c.id))
          ? m(MembershipButton, {
            community: c.id,
            onMembershipChanged: (created) => {
              if (created) justJoinedCommunities.push(c.id);
            }
          })
          : m(Button, {
            intent: 'primary',
            disabled: true,
            iconLeft: Icons.CHECK,
            label: 'Joined',
            style: 'pointer-events: none;',
            size: 'xs',
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

const HomepageCommunities: m.Component<{ disableNavigation? }, { justJoinedChains, justJoinedCommunities }> = {
  oninit: (vnode) => {
    vnode.state.justJoinedChains = [];
    vnode.state.justJoinedCommunities = [];
  },
  view: (vnode) => {
    const { disableNavigation } = vnode.attrs;
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

    return m('.HomepageCommunities', [

      // chains and communities
      m('.my-communities', [
        m('h4', 'My communities'),
        myChains.map(([chain, nodeList] : [string, any]) => m(ChainCard, { chain, nodeList, justJoinedChains, disableNavigation })),
        myCommunities.map((community) => m(CommunityCard, { community, justJoinedCommunities, disableNavigation })),
      ]),
      m('.more-communities', [
        m('h4', 'More communities'),
        otherChains.map(([chain, nodeList] : [string, any]) => m(ChainCard, { chain, nodeList, justJoinedChains, disableNavigation })),
        otherCommunities.map((community) => m(CommunityCard, { community, justJoinedCommunities, disableNavigation })),
      ]),
      // other
      !vnode.attrs.disableNavigation && [
        m(LinkCard, { title: 'Edgeware Lockdrop Statistics', target: '/edgeware/stats' }),
        m(LinkCard, { title: 'Edgeware Lockdrop Unlock', target: '/unlock', }),
      ],
    ]);
  }
};

export default HomepageCommunities;

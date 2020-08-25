import 'pages/home/community_cards.scss';

import m from 'mithril';
import { Button, Icon, Icons, Card, Tag } from 'construct-ui';

import app from 'state';
import { link, pluralize } from 'helpers';
import { NodeInfo, CommunityInfo } from 'models';
import { ChainIcon, CommunityIcon } from 'views/components/chain_icon';

const getNewTag = (labelCount = null) => {
  const label = labelCount === null
    ? 'New'
    : pluralize(labelCount, 'new thread');
  return m('.chain-new', [
    m(Tag, {
      label,
      size: 'sm',
      compact: true,
      rounded: true,
      intent: 'primary',
    })
  ]);
};

const ChainCard : m.Component<{ chain: string, nodeList: NodeInfo[], justJoinedChains: string[] }> = {
  view: (vnode) => {
    const { chain, nodeList, justJoinedChains } = vnode.attrs;
    const chainInfo = app.config.chains.getById(chain);
    const visitedChain = !!app.user.unseenPosts[chain];
    const updatedThreads = app.user.unseenPosts[chain]?.activePosts || 0;

    return m(Card, {
      elevation: 1,
      interactive: true,
      class: 'home-card',
      onclick: (e) => {
        e.preventDefault();
        m.route.set(`/${chain}`);
      },
    }, [
      m('.card-left', [
        m(ChainIcon, { chain: nodeList[0].chain }),
      ]),
      m('.card-right', [
        m('.card-right-top', [
          m('h3', chainInfo.name),
          app.user.isMember({
            account: app.user.activeAccount,
            chain,
          }) && justJoinedChains.indexOf(chain) === -1 && [
            app.isLoggedIn() && !visitedChain && getNewTag(),
            updatedThreads > 0 && getNewTag(updatedThreads),
          ],
        ]),
        m('p.card-description', chainInfo.description),
      ]),
    ]);
  }
};

const CommunityCard : m.Component<{ community: CommunityInfo, justJoinedCommunities: string[] }> = {
  view: (vnode) => {
    const { justJoinedCommunities, community } = vnode.attrs;
    const visitedCommunity = !!app.user.unseenPosts[community.id];
    const updatedThreads = app.user.unseenPosts[community.id]?.activePosts || 0;

    return m(Card, {
      elevation: 1,
      interactive: true,
      class: 'home-card',
      onclick: (e) => {
        e.preventDefault();
        m.route.set(`/${community.id}`);
      },
    }, [
      m('.card-left', [
        m(CommunityIcon, { community }),
      ]),
      m('.card-right', [
        m('.card-right-top', [
          m('h3', [
            community.name,
            community.privacyEnabled && m('span.icon-lock'),
          ]),
          app.user.isMember({ account: app.user.activeAccount, community: community.id })
            && justJoinedCommunities.indexOf(community.id) === -1
            && [
              app.isLoggedIn() && !visitedCommunity && getNewTag(),
              updatedThreads > 0 && getNewTag(updatedThreads),
            ],
        ]),
        m('p.card-description', community.description),
      ]),
    ]);
  }
};

const LockdropToolsCard: m.Component<{}> = {
  view: (vnode) => {
    return m(Card, {
      elevation: 1,
      class: 'home-card LockdropToolsCard',
    }, [
      m('.card-right', [
        m('h3', 'Edgeware Lockdrop Tools'),
        m(Button, {
          interactive: true,
          compact: true,
          fluid: true,
          intent: 'primary',
          size: 'sm',
          onclick: (e) => {
            e.preventDefault();
            m.route.set('/edgeware/stats');
          },
          label: [ 'Lockdrop stats ', m(Icon, { name: Icons.ARROW_RIGHT }) ],
        }),
        m(Button, {
          interactive: true,
          compact: true,
          fluid: true,
          intent: 'primary',
          size: 'sm',
          onclick: (e) => {
            e.preventDefault();
            m.route.set('/edgeware/unlock');
          },
          label: [ 'Unlock ETH ', m(Icon, { name: Icons.ARROW_RIGHT }) ],
        }),
      ]),
    ]);
  }
};

const NewCommunityCard: m.Component<{}> = {
  view: (vnode) => {
    return m(Card, {
      elevation: 1,
      interactive: true,
      class: 'home-card NewCommunityCard',
      onclick: (e) => {
        e.preventDefault();
        document.location = 'https://hicommonwealth.typeform.com/to/cRP27Rp5' as any;
      }
    }, [
      m('.card-right', [
        m('h3', 'Create a new community'),
        m('p.action', 'Launch and grow your decentralized community on Commonwealth'),
        link('a.learn-more', 'https://hicommonwealth.typeform.com/to/cRP27Rp5', m.trust('Learn more &raquo;')),
      ]),
    ]);
  }
};

const HomepageCommunityCards: m.Component<{}, { justJoinedChains: string[], justJoinedCommunities: string[] }> = {
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
      myChains = Object.entries(chains).filter(([c, nodeList]) => {
        return app.user.isMember({ account: app.user.activeAccount, chain: c })
          && vnode.state.justJoinedChains.indexOf(c) === -1;
      });
      myCommunities = app.config.communities.getAll().filter((c) => {
        return app.user.isMember({ account: app.user.activeAccount, community: c.id })
          && vnode.state.justJoinedCommunities.indexOf(c.id) === -1;
      });
      otherChains = Object.entries(chains).filter(([c, nodeList]) => {
        return !app.user.isMember({ account: app.user.activeAccount, chain: c })
          || vnode.state.justJoinedChains.indexOf(c) !== -1;
      });
      otherCommunities = app.config.communities.getAll().filter((c) => {
        return c.visible && (
          !app.user.isMember({ account: app.user.activeAccount, community: c.id })
            || vnode.state.justJoinedCommunities.indexOf(c.id) !== -1);
      });
    }

    return m('.HomepageCommunityCards', [
      m('.communities-list', [
        myChains.map(([chain, nodeList] : [string, any]) => m(ChainCard, { chain, nodeList, justJoinedChains })),
        myCommunities.map((community) => m(CommunityCard, { community, justJoinedCommunities })),
        otherChains.map(([chain, nodeList] : [string, any]) => m(ChainCard, { chain, nodeList, justJoinedChains })),
        otherCommunities.map((community) => m(CommunityCard, { community, justJoinedCommunities })),
        m('.clear'),
      ]),
      m('.other-list', [
        m(NewCommunityCard),
        m(LockdropToolsCard),
        m('.clear'),
      ]),
    ]);
  }
};

export default HomepageCommunityCards;

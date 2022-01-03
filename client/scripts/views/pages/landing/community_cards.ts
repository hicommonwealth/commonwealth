/* eslint-disable @typescript-eslint/ban-types */
import 'pages/landing/community_cards.scss';

import m from 'mithril';
import { Button, Icon, Icons, Card, Tag } from 'construct-ui';

import app from 'state';
import { link, pluralize } from 'helpers';
import { NodeInfo, AddressInfo, ChainInfo } from 'models';
import { ChainIcon } from 'views/components/chain_icon';
import UserGallery from 'views/components/widgets/user_gallery';

const getNewTag = (labelCount = null) => {
  const label = labelCount === null ? 'New' : `${labelCount} new`;
  return m('span.chain-new', [
    m(Tag, {
      label,
      size: 'xs',
      rounded: true,
      intent: 'primary',
      style: 'margin-top: -3px; margin-left: 10px;',
    })
  ]);
};

const ChainCard : m.Component<{ chain: string, nodeList: NodeInfo[] }> = {
  view: (vnode) => {
    const { chain, nodeList } = vnode.attrs;
    const { unseenPosts } = app.user;
    const chainInfo = app.config.chains.getById(chain);
    const visitedChain = !!unseenPosts[chain];
    const updatedThreads = unseenPosts[chain]?.activePosts || 0;
    const monthlyThreadCount = app.recentActivity.getCommunityThreadCount(chain);

    return m(Card, {
      elevation: 1,
      interactive: true,
      class: 'home-card',
      onclick: (e) => {
        e.preventDefault();
        localStorage['home-scrollY'] = window.scrollY;
        m.route.set(`/${chain}`);
      },
    }, [
      m('.card-left', [
        m(ChainIcon, { chain: nodeList[0].chain }),
      ]),
      m('.card-right', [
        m('.card-right-top', [
          m('h3', chainInfo.name),
        ]),
        m('p.card-description', chainInfo.description),
        // if no recently active threads, hide this module altogether
        m('.recent-activity', !!monthlyThreadCount && [
          m('span.recent-threads', monthlyThreadCount > 20 ? [
            pluralize(Math.floor(monthlyThreadCount / 5), 'thread'),
            ' / week',
          ] : [
            pluralize(monthlyThreadCount, 'thread'),
            ' / month',
          ]),
          app.user.isMember({
            account: app.user.activeAccount,
            chain,
          }) && [
            app.isLoggedIn() && !visitedChain && getNewTag(),
            updatedThreads > 0 && getNewTag(updatedThreads),
          ],
        ])
      ]),
    ]);
  }
};

const CommunityCard : m.Component<{ community: ChainInfo }> = {
  view: (vnode) => {
    const { community } = vnode.attrs;
    const { unseenPosts } = app.user;
    const visitedCommunity = !!unseenPosts[community.id];
    const updatedThreads = unseenPosts[community.id]?.activePosts || 0;
    const monthlyThreadCount = app.recentActivity.getCommunityThreadCount(community.id);

    return m(Card, {
      elevation: 1,
      interactive: true,
      class: 'home-card',
      onclick: (e) => {
        e.preventDefault();
        localStorage['home-scrollY'] = window.scrollY;
        m.route.set(`/${community.id}`);
      },
    }, [
      m('.card-left', [
        m(ChainIcon, { chain: community }),
      ]),
      m('.card-right', [
        m('.card-right-top', [
          m('h3', [
            community.name,
            // community.privacyEnabled && m(Icon, { name: Icons.LOCK, size: 'xs' }),
          ]),
        ]),
        m('p.card-description', community.description),
        // if no recently active threads, hide this module altogether
        m('.recent-activity', !!monthlyThreadCount && [
          m('span.recent-threads', monthlyThreadCount > 20 ? [
            pluralize(Math.floor(monthlyThreadCount / 5), 'thread'),
            ' / week',
          ] : [
            pluralize(monthlyThreadCount, 'thread'),
            ' / month',
          ]),
          app.user.isMember({ account: app.user.activeAccount, community: community.id })
            && [
              app.isLoggedIn() && !visitedCommunity && getNewTag(),
              updatedThreads > 0 && getNewTag(updatedThreads),
            ],
        ])
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
        m('h3', { style: 'margin-top: 4px;' }, 'Edgeware Lockdrop Tools'),
        m(Button, {
          interactive: true,
          compact: true,
          fluid: true,
          rounded: true,
          intent: 'primary',
          onclick: (e) => {
            e.preventDefault();
            localStorage['home-scrollY'] = window.scrollY;
            m.route.set('/edgeware/stats');
          },
          label: [ 'Lockdrop stats ', m(Icon, { name: Icons.ARROW_RIGHT }) ],
        }),
        m(Button, {
          interactive: true,
          compact: true,
          fluid: true,
          rounded: true,
          intent: 'primary',
          onclick: (e) => {
            e.preventDefault();
            localStorage['home-scrollY'] = window.scrollY;
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
        m('a.learn-more', { href: '#' }, m.trust('Learn more &raquo;')),
      ]),
    ]);
  }
};

const HomepageCommunityCards: m.Component<{}, {}> = {
  view: (vnode) => {
    const chains = {};
    app.config.nodes.getAll().forEach((n) => {
      if (chains[n.chain.id]) {
        chains[n.chain.id].push(n);
      } else {
        chains[n.chain.id] = [n];
      }
    });

    const myChains: any = Object.entries(chains);
    // const myCommunities: any = app.config.communities.getAll();

    const sortChainsAndCommunities = (list) => list.sort((a, b) => {
      const threadCountA = app.recentActivity.getCommunityThreadCount(Array.isArray(a) ? a[0] : a.id);
      const threadCountB = app.recentActivity.getCommunityThreadCount(Array.isArray(b) ? b[0] : b.id);
      return (threadCountB - threadCountA);
    }).map((entity) => {
      if (Array.isArray(entity)) {
        const [chain, nodeList]: [string, any] = entity as any;
        return  m(ChainCard, { chain, nodeList });
      } else if (entity.id) {
        return m(CommunityCard, { community: entity });
      }
      return null;
    });

    const sortedChainsAndCommunities = sortChainsAndCommunities(
      myChains.filter((c) => c[1][0] && !c[1][0].chain.collapsedOnHomepage)
        // .concat(myCommunities.filter((c) => !c.collapsedOnHomepage))
    );
    const betaChainsAndCommunities = sortChainsAndCommunities(
      myChains.filter((c) => c[1][0] && c[1][0].chain.collapsedOnHomepage)
        // .concat(myCommunities.filter((c) => c.collapsedOnHomepage))
    );

    return m('.HomepageCommunityCards', {
      style: 'margin-top: 40px',
    }, [
      m('.communities-list', [
        sortedChainsAndCommunities,
        m('.clear'),
        betaChainsAndCommunities.length > 0 && m('h4', 'Testnets & Alpha Networks'),
        betaChainsAndCommunities,
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

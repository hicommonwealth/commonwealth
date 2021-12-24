import 'pages/landing/community_cards.scss';

import m from 'mithril';
import { Button, Icon, Icons, Card, Tag } from 'construct-ui';

import app from 'state';
import { link, pluralize } from 'helpers';
import { NodeInfo, CommunityInfo, AddressInfo } from 'models';
import { ChainIcon, CommunityIcon } from 'views/components/chain_icon';
import UserGallery from 'views/components/widgets/user_gallery';
import { FaceliftCard } from '../../components/component_kit/cards';
import { ButtonIntent, FaceliftButton } from '../../components/component_kit/buttons';

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

    const redirectFunction = (e) => {
      e.preventDefault();
        localStorage['home-scrollY'] = window.scrollY;
        m.route.set(`/${chain}`);
    }

    // Potentially Temporary (could be built into create community flow)
    let pretty_description = '';
    if (chainInfo.description) {
      pretty_description = chainInfo.description[chainInfo.description.length-1] === '.' ? chainInfo.description : chainInfo.description + '.';
    }

    return m(FaceliftCard, {
      elevation: 2,
      interactive: true,
      class_name: '.chain-card',
      onclick: redirectFunction
    }, [    
      m('.card-header', [
        m(ChainIcon, { chain: nodeList[0].chain, size: 100 }),
      ]),
      m('.card-body', [
        m('.community-name', [
          m('h3', chainInfo.name),
        ]),
        m('.card-description', pretty_description),
        m('.join-button-wrapper', [
          m(FaceliftButton, {
            intent: ButtonIntent.Secondary,
            label: 'Join',
            disabled: false,
            onclick: redirectFunction
          }),
        ])
      ]), 
    ]);
  }
};

const CommunityCard : m.Component<{ community: CommunityInfo }> = {
  view: (vnode) => {
    const { community } = vnode.attrs;
    const { unseenPosts } = app.user;
    const visitedCommunity = !!unseenPosts[community.id];
    const updatedThreads = unseenPosts[community.id]?.activePosts || 0;
    const monthlyThreadCount = app.recentActivity.getCommunityThreadCount(community.id);

    const redirectFunction = (e) => {
      e.preventDefault();
        localStorage['home-scrollY'] = window.scrollY;
        m.route.set(`/${community.id}`);
    }

    // Potentially Temporary (could be built into create community flow)
    let pretty_description = '';
    if (community.description) {
      pretty_description = community.description[community.description.length-1] === '.' ? community.description : community.description + '.';
    }
    

    return m(FaceliftCard, {
      elevation: 2,
      interactive: true,
      class_name: '.chain-card',
      onclick: redirectFunction
    }, [    
      m('.card-header', [
        m(CommunityIcon, { community, size: 100 }),
      ]),
      m('.card-body', [
        m('.community-name', [
          m('h3', [
            community.name,
            community.privacyEnabled && m(Icon, { name: Icons.LOCK, size: 'xs' }),
          ]),
        ]),
        m('.card-description', pretty_description),
        m('.join-button-wrapper', [
          m(FaceliftButton, {
            intent: ButtonIntent.Secondary,
            label: 'Join',
            disabled: false,
            onclick: redirectFunction
          }),
        ])
      ]), 
    ]);
  }
};

const LockdropToolsCard: m.Component<{}> = {
  view: (vnode) => {
    return m(FaceliftCard, {
      elevation: 2,
      interactive: true,
      class_name: '.chain-card',
    }, [    
      m('h3', { style: 'margin-top: 4px; display: flex;' }, 'Edgeware Lockdrop Tools'),
      m('.lockdrop-card-body', [
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
      ])
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
    const myCommunities: any = app.config.communities.getAll();

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
        .concat(myCommunities.filter((c) => !c.collapsedOnHomepage))
    );
    const betaChainsAndCommunities = sortChainsAndCommunities(
      myChains.filter((c) => c[1][0] && c[1][0].chain.collapsedOnHomepage)
        .concat(myCommunities.filter((c) => c.collapsedOnHomepage))
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

import 'components/header/community_selector.scss';

import m from 'mithril';
import { Button, Icon, Icons, List, ListItem, SelectList } from 'construct-ui';

import app from 'state';
import { ChainInfo, CommunityInfo } from 'models';
import { SwitchIcon } from 'helpers';
import { isMember } from 'helpers/roles';

import { ChainIcon, CommunityIcon } from 'views/components/chain_icon';
import ChainStatusIndicator from 'views/components/chain_status_indicator';

export const getSelectableCommunities = () => {
  return (app.config.communities.getAll() as (CommunityInfo | ChainInfo)[])
    .concat(app.config.chains.getAll())
    .sort((a, b) => a.name.localeCompare(b.name))
    .sort((a, b) => {
      // sort starred communities at top
      if (a instanceof ChainInfo && app.communities.isStarred(a.id, null)) return -1;
      if (a instanceof CommunityInfo && app.communities.isStarred(null, a.id)) return -1;
      return 0;
    })
    .filter((item) => {
      // only show chains with nodes
      return (item instanceof ChainInfo)
        ? app.config.nodes.getByChain(item.id)?.length
        : true;
    });
};

const CommunityLabel: m.Component<{ chain?: ChainInfo, community?: CommunityInfo, showStatus?: boolean }> = {
  view: (vnode) => {
    const { chain, community, showStatus } = vnode.attrs;

    if (chain) return m('.CommunityLabel', [
      m('.community-label-left', [
        m(ChainIcon, { chain }),
      ]),
      m('.community-label-right', [
        m('.community-name-row', [
          m('span.community-name', chain.name),
          showStatus === true && m(ChainStatusIndicator, { hideLabel: true }),
        ]),
        m('.community-id', `/${chain.id}`),
      ]),
    ]);

    if (community) return m('.CommunityLabel', [
      m('.community-label-left', [
        m(CommunityIcon, { community }),
      ]),
      m('.community-label-right', [
        m('.community-name-row', [
          m('span.community-name', community.name),
          showStatus === true && [
            community.privacyEnabled && m('span.icon-lock'),
            !community.privacyEnabled && m('span.icon-globe'),
          ],
        ]),
        m('.community-id', `/${community.id}`),
      ]),
    ]);

    return m('.CommunityLabel.CommunityLabelPlaceholder', [
      m('span.community-name', 'Select a community'),
    ]);
  }
};

const CurrentCommunityLabel: m.Component<{}> = {
  view: (vnode) => {
    const nodes = app.config.nodes.getAll();
    const activeNode = app.chain?.meta;
    const selectedNodes = nodes.filter((n) => activeNode && n.url === activeNode.url
                                       && n.chain && activeNode.chain && n.chain.id === activeNode.chain.id);
    const selectedNode = selectedNodes.length > 0 && selectedNodes[0];
    const selectedCommunity = app.community;

    if (selectedNode) {
      return m(CommunityLabel, { chain: selectedNode.chain, showStatus: true });
    } else if (selectedCommunity) {
      return m(CommunityLabel, { community: selectedCommunity.meta, showStatus: true });
    } else {
      return m(CommunityLabel, { showStatus: true });
    }
  }
};

const CommunitySelector = {
  view: (vnode) => {
    const selectableCommunities = getSelectableCommunities();
    const currentIndex = selectableCommunities.findIndex((item) => {
      if (item instanceof ChainInfo) return app.activeChainId() === item.id;
      if (item instanceof CommunityInfo) return app.activeCommunityId() === item.id;
      return false;
    });

    return m('.CommunitySelector', [
      m('.title-selector', [
        m(SelectList, {
          closeOnSelect: true,
          class: 'CommunitySelectList',
          items: (selectableCommunities as any).concat('home'),
          activeIndex: currentIndex,
          itemRender: (item) => {
            return item instanceof ChainInfo
              ? m(ListItem, {
                class: app.communities.isStarred(item.id, null) ? 'starred' : '',
                label: m(CommunityLabel, { chain: item }),
                selected: app.activeChainId() === item.id,
                contentRight: app.isLoggedIn() && isMember(item.id, null) && m('.community-star-toggle', {
                  onclick: (e) => {
                    app.communities.setStarred(item.id, null, !app.communities.isStarred(item.id, null));
                  }
                }, [
                  m(Icon, { name: Icons.STAR }),
                ]),
              })
              : item instanceof CommunityInfo
              ? m(ListItem, {
                class: app.communities.isStarred(null, item.id) ? 'starred' : '',
                label: m(CommunityLabel, { community: item }),
                selected: app.activeCommunityId() === item.id,
                contentRight: app.isLoggedIn() && isMember(null, item.id) && m('.community-star-toggle', {
                  onclick: (e) => {
                    app.communities.setStarred(null, item.id, !app.communities.isStarred(null, item.id));
                  },
                }, [
                  m(Icon, { name: Icons.STAR }),
                ]),
              })
              : m(ListItem, {
                class: 'select-list-back-home',
                label: 'Back to home',
              });
          },
          onSelect: (item: any) => {
            m.route.set(item.id ? `/${item.id}` : '/');
          },
          filterable: false,
          checkmark: false,
          popoverAttrs: {
            hasArrow: false
          },
          trigger: m(Button, {
            align: 'left',
            basic: true,
            compact: true,
            label: [
              m(CurrentCommunityLabel),
              m(SwitchIcon),
            ],
            style: 'min-width: 200px',
          }),
        }),
        //   app.isLoggedIn() && (app.community || app.chain)
        //     && m(SubscriptionButton),
      ]),
    ]);
  }
};

export default CommunitySelector;

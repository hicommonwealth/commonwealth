import 'components/sidebar/community_selector.scss';

import m from 'mithril';
import { Button, Icon, Icons, List, ListItem, PopoverMenu, MenuItem } from 'construct-ui';

import app from 'state';
import { ChainInfo, CommunityInfo } from 'models';
import { SwitchIcon } from 'helpers';

import { ChainIcon, CommunityIcon } from 'views/components/chain_icon';
import ChainStatusIndicator from 'views/components/chain_status_indicator';

export const CommunityLabel: m.Component<{
  chain?: ChainInfo,
  community?: CommunityInfo,
  showStatus?: boolean,
  link?: boolean,
}> = {
  view: (vnode) => {
    const { chain, community, showStatus, link } = vnode.attrs;

    if (chain) return m('.CommunityLabel', [
      m('.community-label-left', [
        m(ChainIcon, {
          size: 18,
          chain,
          onclick: link ? (() => m.route.set(`/${chain.id}`)) : null
        }),
      ]),
      m('.community-label-right', [
        m('.community-name-row', [
          m('span.community-name', chain.name),
          showStatus === true && m(ChainStatusIndicator, { hideLabel: true }),
        ]),
      ]),
    ]);

    if (community) return m('.CommunityLabel', [
      m('.community-label-left', [
        m(CommunityIcon, {
          size: 18,
          community,
          onclick: link ? (() => m.route.set(`/${community.id}`)) : null
        }),
      ]),
      m('.community-label-right', [
        m('.community-name-row', [
          m('span.community-name', community.name),
          showStatus === true && [
            community.privacyEnabled && m('span.icon-lock'),
            !community.privacyEnabled && m('span.icon-globe'),
          ],
        ]),
      ]),
    ]);

    return m('.CommunityLabel.CommunityLabelPlaceholder', [
      m('.visible-sm', 'Commonwealth')
    ]);
  }
};

export const CurrentCommunityLabel: m.Component<{}> = {
  view: (vnode) => {
    const nodes = app.config.nodes.getAll();
    const activeNode = app.chain?.meta;
    const selectedNodes = nodes.filter((n) => activeNode && n.url === activeNode.url
                                       && n.chain && activeNode.chain && n.chain.id === activeNode.chain.id);
    const selectedNode = selectedNodes.length > 0 && selectedNodes[0];
    const selectedCommunity = app.community;

    if (selectedNode) {
      return m(CommunityLabel, { chain: selectedNode.chain, showStatus: true, link: true });
    } else if (selectedCommunity) {
      return m(CommunityLabel, { community: selectedCommunity.meta, showStatus: true, link: true });
    } else {
      return m(CommunityLabel, { showStatus: true, link: true });
    }
  }
};

const CommunitySelector = {
  view: (vnode) => {
    const allCommunities = (app.config.communities.getAll() as (CommunityInfo | ChainInfo)[])
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

    const currentCommunity = allCommunities.find((item) => {
      if (item instanceof ChainInfo) return app.activeChainId() === item.id;
      if (item instanceof CommunityInfo) return app.activeCommunityId() === item.id;
      return false;
    });

    const isInCommunity = (item) => {
      if (item instanceof ChainInfo) {
        return app.user.getAllRolesInCommunity({ chain: item.id }).length > 0;
      } else if (item instanceof CommunityInfo) {
        return app.user.getAllRolesInCommunity({ community: item.id }).length > 0;
      } else {
        return false;
      }
    };
    const joinedCommunities = allCommunities.filter((c) => isInCommunity(c));
    const unjoinedCommunities = allCommunities.filter((c) => !isInCommunity(c));

    const renderCommunity = (item) => {
      return item instanceof ChainInfo
        ? m(ListItem, {
          class: app.communities.isStarred(item.id, null) ? 'starred' : '',
          label: m(CommunityLabel, { chain: item }),
          selected: app.activeChainId() === item.id,
          onclick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            m.route.set(item.id ? `/${item.id}` : '/');
          },
          contentRight: app.isLoggedIn() && app.user.isMember({
            account: app.user.activeAccount,
            chain: item.id
          }) && m('.community-star-toggle', {
            onclick: (e) => {
              e.preventDefault();
              e.stopPropagation();
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
            onclick: () => {
              m.route.set(item.id ? `/${item.id}` : '/');
            },
            contentRight: app.isLoggedIn() && app.user.isMember({
              account: app.user.activeAccount,
              community: item.id
            }) && m('.community-star-toggle', {
              onclick: (e) => {
                e.preventDefault();
                e.stopPropagation();
                app.communities.setStarred(null, item.id, !app.communities.isStarred(null, item.id));
              },
            }, [
              m(Icon, { name: Icons.STAR }),
            ]),
          })
          : m.route.get() !== '/'
            ? m(ListItem, {
              class: 'select-list-back-home',
              label: '« Back home',
              onclick: () => {
                m.route.set(item.id ? `/${item.id}` : '/');
              },
            }) : null;
    };

    return m('.CommunitySelector', [
      m('.title-selector', [
        m(PopoverMenu, {
          transitionDuration: 0,
          hasArrow: false,
          inline: true,
          trigger: m(Button, {
            class: 'CommunitySelectList',
            label: [
              currentCommunity instanceof CommunityInfo
                ? m(CommunityLabel, { community: currentCommunity })
                : m(CommunityLabel, { chain: currentCommunity }),
            ],
          }),
          class: 'CommunitySelectList',
          content: [
            app.isLoggedIn() && [
              m('h4', 'Your communities'),
              joinedCommunities.map(renderCommunity),
              joinedCommunities.length === 0 && m('.community-placeholder', 'None'),
              m('h4', 'More communities'),
            ],
            unjoinedCommunities.map(renderCommunity),
            renderCommunity('home'),
          ],
        })
      ]),
    ]);
  }
};

export default CommunitySelector;

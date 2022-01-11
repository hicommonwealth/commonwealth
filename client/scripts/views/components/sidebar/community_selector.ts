/* eslint-disable @typescript-eslint/ban-types */
import 'components/sidebar/community_selector.scss';

import m from 'mithril';
import { Button, Icon, Icons, ListItem, PopoverMenu } from 'construct-ui';

import app from 'state';
import { AddressInfo, ChainInfo, RoleInfo } from 'models';

import { ChainIcon, TokenIcon } from 'views/components/chain_icon';
import ChainStatusIndicator from 'views/components/chain_status_indicator';
import User, { UserBlock } from '../widgets/user';

export const CommunityLabel: m.Component<{
  chain?: ChainInfo,
  token?: any,
  showStatus?: boolean,
  link?: boolean,
  size?: number,
}> = {
  view: (vnode) => {
    const { chain, token, showStatus, link } = vnode.attrs;

    if (chain) return m('.CommunityLabel', [
      m('.community-label-left', [
        m(ChainIcon, {
          size: vnode.attrs.size || 18,
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

    if (token) return m('.TokenLabel', [
      m('.token-label-left', [
        m(TokenIcon, {
          size: vnode.attrs.size || 18,
          token,
          onclick: link ? (() => m.route.set(`/${token.id}`)) : null
        }),
      ]),
      m('.token-label-right', [
        m('.token-name-row', [
          m('span.token-name', token.name),
          showStatus === true && [
            token.privacyEnabled && m(Icon, { name: Icons.LOCK, size: 'xs' }),
            !token.privacyEnabled && m(Icon, { name: Icons.GLOBE, size: 'xs' }),
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

    if (selectedNode) {
      return m(CommunityLabel, { chain: selectedNode.chain, showStatus: true, link: true });
    } else {
      return m(CommunityLabel, { showStatus: true, link: true });
    }
  }
};

const CommunitySelector: m.Component<{
  showTextLabel?: boolean,
  showListOnly?: boolean,
  showHomeButtonAtTop?: boolean
}> = {
  view: (vnode) => {
    const { showTextLabel, showListOnly, showHomeButtonAtTop } = vnode.attrs;
    const activeEntityName = app.chain?.meta.chain.name;
    const allCommunities = (app.config.chains.getAll())
      .sort((a, b) => a.name.localeCompare(b.name))
      .sort((a, b) => {
        // sort starred communities at top
        if (a instanceof ChainInfo && app.communities.isStarred(a.id, null)) return -1;
        return 0;
      })
      .filter((item) => {
        // only show chains with nodes
        return (item instanceof ChainInfo)
          ? app.config.nodes.getByChain(item.id)?.length
          : true;
      });

    const isInCommunity = (item) => {
      if (item instanceof ChainInfo) {
        return app.user.getAllRolesInCommunity({ chain: item.id }).length > 0;
      } else {
        return false;
      }
    };
    const joinedCommunities = allCommunities.filter((c) => isInCommunity(c));
    const unjoinedCommunities = allCommunities.filter((c) => !isInCommunity(c));

    const renderCommunity = (item) => {
      const roles: RoleInfo[] = [];
      if (item instanceof ChainInfo) {
        roles.push(...app.user.getAllRolesInCommunity({ chain: item.id }));
      }

      const profile = (roles[0]?.address_chain)
        ? app.profiles.getProfile(roles[0].address_chain, roles[0].address)
        : null;

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
          contentRight: app.isLoggedIn()
            && roles.length > 0
            && m('.community-star-toggle', {
              onclick: async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await app.communities.setStarred(item.id, null, !app.communities.isStarred(item.id, null));
                m.redraw();
              }
            }, [
              roles.map((role) => {
                return m(User, {
                  avatarSize: 18,
                  avatarOnly: true,
                  user: new AddressInfo(null, role.address, role.address_chain, null),
                });
              }),
              m('.star-icon', [
                m(Icon, { name: Icons.STAR, key: item.id, }),
              ]),
            ]),
        })
        : (m.route.get() !== '/')
            ? m(ListItem, {
              class: 'select-list-back-home',
              label: '« Back home',
              onclick: () => {
                m.route.set(item.id ? `/${item.id}` : '/');
              },
            }) : null;
    };

    return showListOnly
      ? m('.CommunitySelectList', [
        showHomeButtonAtTop
        && m('a.home-button', {
          href: '/',
          onclick: (e) => { m.route.set('/'); },
        }, [
          m('img.mobile-logo', {
            src: 'https://commonwealth.im/static/img/logo.png',
            style: 'height:18px;width:18px;background:black;border-radius:50%;'
          }),
          m('span', 'Home'),
        ]),
        app.isLoggedIn() && [
          m('h4', 'Your communities'),
          joinedCommunities.map(renderCommunity),
          joinedCommunities.length === 0 && m('.community-placeholder', 'None'),
          m('h4', 'Other communities'),
        ],
        unjoinedCommunities.map(renderCommunity),
        !showHomeButtonAtTop
        && renderCommunity('home'),
      ])
      : m('.CommunitySelector', [
        m('.title-selector', [
          m(PopoverMenu, {
            transitionDuration: 0,
            hasArrow: false,
            trigger: m(Button, {
              rounded: true,
              label: showTextLabel ? activeEntityName : m(Icon, { name: Icons.MENU }),
            }),
            inline: true,
            class: 'CommunitySelectList',
            content: [
              app.isLoggedIn() && [
                m('h4', 'Your communities'),
                joinedCommunities.map(renderCommunity),
                joinedCommunities.length === 0 && m('.community-placeholder', 'None'),
                m('h4', 'Other communities'),
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

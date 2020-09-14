/* eslint-disable no-script-url */
import 'components/widgets/user.scss';

import m from 'mithril';
import _ from 'lodash';
import { formatAddressShort, link } from 'helpers';
import { Tooltip, Tag, Icon, Icons } from 'construct-ui';

import app from 'state';
import { Account, AddressInfo, ChainInfo, ChainBase } from 'models';

const User: m.Component<{
  user: Account<any> | AddressInfo;
  avatarSize?: number;
  avatarOnly?: boolean; // avatarOnly overrides most other properties
  hideAvatar?: boolean;
  hideIdentityIcon?: boolean; // only applies to substrate identities
  linkify?: boolean;
  onclick?: any;
  tooltip?: boolean;
  showRole?: boolean;
}, {
  identityWidgetLoading: boolean;
  IdentityWidget: any;
}> = {
  view: (vnode) => {
    // TODO: Fix showRole logic to fetch the role from chain
    const { avatarOnly, hideAvatar, hideIdentityIcon, user, linkify, tooltip, showRole } = vnode.attrs;
    const avatarSize = vnode.attrs.avatarSize || 16;
    const showAvatar = !hideAvatar;
    if (!user) return;

    let account : Account<any>;
    let profile; // profile is used to retrieve the chain and address later
    let role;

    const addrShort = formatAddressShort(user.address, typeof user.chain === 'string' ? user.chain : user.chain?.id);

    const adminsAndMods = app.chain
      ? app.chain.meta.chain.adminsAndMods
      : app.community ? app.community.meta.adminsAndMods : [];

    if (app.chain?.base === ChainBase.Substrate && !vnode.state.identityWidgetLoading && !vnode.state.IdentityWidget) {
      vnode.state.identityWidgetLoading = true;
      import(
        /* webpackMode: "lazy" */
        /* webpackChunkName: "substrate-identity-widget" */
        './substrate_identity'
      ).then((mod) => {
        vnode.state.IdentityWidget = mod.default;
        vnode.state.identityWidgetLoading = false;
      });
    }

    if (vnode.attrs.user instanceof AddressInfo) {
      const chainId = vnode.attrs.user.chain;
      const address = vnode.attrs.user.address;
      if (!chainId || !address) return;
      // only load account if it's possible to, using the current chain
      if (app.chain && app.chain.id === chainId) {
        account = app.chain.accounts.get(address);
      }
      profile = app.profiles.getProfile(chainId, address);
      role = adminsAndMods.find((r) => r.address === address && r.address_chain === chainId);
    } else {
      account = vnode.attrs.user;
      // TODO: we should remove this, since account should always be of type Account,
      // but we currently inject objects of type 'any' on the profile page
      const chainId = typeof account.chain === 'string' ? account.chain : account.chain.id;
      profile = account.profile;
      role = adminsAndMods.find((r) => r.address === account.address && r.address_chain === chainId);
    }
    const roleTag = role ? m(Tag, {
      class: 'role-tag',
      label: role.permission,
      rounded: true,
      size: 'xs',
    }) : null;

    const userFinal = avatarOnly
      ? m('.User.avatar-only', {
        key: profile?.address || '-',
      }, [
        m('.user-avatar-only', { style: `width: ${avatarSize}px; height: ${avatarSize}px;`, }, [
          !profile ? null
            : profile.avatarUrl
              ? profile.getAvatar(avatarSize)
              : profile.getAvatar(avatarSize - 4)
        ]),
      ])
      : m('.User', {
        key: profile?.address || '-',
        class: linkify ? 'linkified' : '',
      }, [
        showAvatar && m('.user-avatar', {
          style: `width: ${avatarSize}px; height: ${avatarSize}px;`,
        }, profile && profile.getAvatar(avatarSize)),
        (app.chain && app.chain.base === ChainBase.Substrate && vnode.state.IdentityWidget)
          // substrate name
          ? m(vnode.state.IdentityWidget, { account, linkify, profile, hideIdentityIcon, addrShort }) : [
            // non-substrate name
            linkify
              ? link('a.user-display-name.username',
                profile
                  ? `/${m.route.param('scope') || profile.chain}/account/${profile.address}?base=${profile.chain}`
                  : 'javascript:',
                profile ? profile.name : addrShort)
              : m('a.user-display-name.username', profile ? profile.name : addrShort)
          ],
        showRole && roleTag,
      ]);

    const tooltipPopover = m('.UserTooltip', {
      onclick: (e) => {
        e.stopPropagation();
      }
    }, [
      m('.user-avatar', [
        !profile ? null
          : profile.avatarUrl
            ? profile.getAvatar(36)
            : profile.getAvatar(32)
      ]),
      m('.user-name', [
        (app.chain && app.chain.base === ChainBase.Substrate && vnode.state.IdentityWidget)
          ? m(vnode.state.IdentityWidget, { account, linkify: true, profile, hideIdentityIcon, addrShort })
          : link(`a.user-display-name${
            (profile && profile.name !== 'Anonymous') ? '.username' : '.anonymous'}`,
          profile
            ? `/${m.route.param('scope') || profile.chain}/account/${profile.address}?base=${profile.chain}`
            : 'javascript:',
          profile ? profile.name : addrShort)
      ]),
      profile?.address && m('.user-address', formatAddressShort(profile.address, profile.chain)),
      showRole && roleTag,
    ]);

    return tooltip
      ? m(Tooltip, { content: tooltipPopover, hoverOpenDelay: 1000, trigger: userFinal, key: profile?.address || '-' })
      : userFinal;
  }
};

export const UserBlock: m.Component<{
  user: Account<any> | AddressInfo,
  hideIdentityIcon?: boolean,
  tooltip?: boolean,
  showRole?: boolean,
  selected?: boolean,
  compact?: boolean,
}> = {
  view: (vnode) => {
    const { user, hideIdentityIcon, tooltip, showRole, selected, compact } = vnode.attrs;

    let profile;
    if (user instanceof AddressInfo) {
      if (!user.chain || !user.address) return;
      profile = app.profiles.getProfile(user.chain, user.address);
    } else {
      profile = app.profiles.getProfile(user.chain.id, user.address);
    }

    return m('.UserBlock', {
      class: compact ? 'compact' : ''
    }, [
      m('.user-block-left', [
        m(User, {
          user,
          avatarOnly: true,
          avatarSize: 28,
          tooltip,
        }),
        // TODO: this is weird...symbol display should not depend on user being an Account
        user.chain instanceof ChainInfo && m('.user-block-symbol', user.chain.symbol),
      ]),
      m('.user-block-center', [
        m('.user-block-name', [
          m(User, {
            user,
            hideAvatar: true,
            hideIdentityIcon,
            tooltip,
            showRole,
          }),
        ]),
        m('.user-block-address', {
          class: profile?.address ? '' : 'no-address',
        }, [
          profile?.address && formatAddressShort(profile.address, profile.chain),
        ]),
      ]),
      m('.user-block-right', [
        m('.user-block-selected', selected ? m(Icon, { name: Icons.CHECK }) : ''),
      ]),
    ]);
  }
};

export default User;

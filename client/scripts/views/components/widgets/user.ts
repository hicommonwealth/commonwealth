/* eslint-disable no-script-url */
import 'components/widgets/user.scss';

import m from 'mithril';
import _ from 'lodash';
import { formatAddressShort, link, formatAsTitleCase } from 'helpers';
import { Tooltip, Tag } from 'construct-ui';

import app from 'state';
import { Account, Profile, AddressInfo } from 'models';

import { makeDynamicComponent } from 'models/mithril';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import Substrate from 'controllers/chain/substrate/main';
import SubstrateIdentity, { IdentityQuality } from 'controllers/chain/substrate/identity';

interface IAttrs {
  user: Account<any> | AddressInfo;
  avatarSize?: number;
  avatarOnly?: boolean; // avatarOnly overrides most other properties
  hideAvatar?: boolean;
  hideIdentityIcon?: boolean; // only applies to substrate identities
  linkify?: boolean;
  onclick?: any;
  tooltip?: boolean;
  showRole?: boolean;
}

export interface ISubstrateIdentityAttrs {
  account: Account<any>;
  linkify: boolean;
  profile: Profile;
  hideIdentityIcon: boolean; // only applies to substrate identities
}

export interface ISubstrateIdentityState {
  dynamic: {
    identity: SubstrateIdentity | null;
  },
}

const SubstrateIdentityWidget = makeDynamicComponent<ISubstrateIdentityAttrs, ISubstrateIdentityState>({
  getObservables: (attrs) => ({
    groupKey: attrs.account.address,
    identity: (attrs.account instanceof SubstrateAccount)
      ? (app.chain as Substrate).identities.get(attrs.account)
      : null,
  }),
  view: (vnode) => {
    const { profile, linkify, account } = vnode.attrs;
    // return polkadot identity if possible
    const identity = vnode.state.dynamic.identity;
    const displayName = identity?.exists ? identity.username : undefined;
    const quality = identity?.exists ? identity.quality : undefined;
    if (displayName && quality) {
      const name = [ displayName, m(`span.identity-icon${
        quality === IdentityQuality.Good ? '.icon-ok-circled' : '.icon-minus-circled'
      }${quality === IdentityQuality.Good
        ? '.green' : quality === IdentityQuality.Bad
          ? '.red' : '.gray'}`) ];

      return linkify
        ? link(
          'a.user-display-name.username.onchain-username',
          profile ? `/${profile.chain}/account/${profile.address}` : 'javascript:',
          name
        )
        : m('a.user-display-name.username.onchain-username', name);
    }

    // return offchain name while identity is loading
    return linkify
      ? link(`a.user-display-name${(profile && profile.displayName !== 'Anonymous') ? '.username' : '.anonymous'}`,
        profile ? `/${profile.chain}/account/${profile.address}` : 'javascript:',
        profile ? profile.displayName : '--',)
      : m('a.user-display-name.username', profile ? profile.displayName : '--');
  }
});

const User : m.Component<IAttrs> = {
  view: (vnode) => {
    const { avatarOnly, hideAvatar, hideIdentityIcon, user, linkify, tooltip, showRole } = vnode.attrs;
    const avatarSize = vnode.attrs.avatarSize || 16;
    const showAvatar = !hideAvatar;
    if (!user) return;

    let account : Account<any>;
    let profile; // profile is used to retrieve the chain and address later
    let role;

    if (vnode.attrs.user instanceof AddressInfo) {
      const chainId = vnode.attrs.user.chain;
      const address = vnode.attrs.user.address;
      if (!chainId || !address) return;
      const chain = app.config.chains.getById(chainId);
      // only load account if it's possible to, using the current chain
      if (app.chain && app.chain.id === chainId) {
        account = app.chain.accounts.get(address);
      }
      profile = app.profiles.getProfile(chainId, address);
      role = app.user.isAdminOrMod({ account: vnode.attrs.user });
    } else {
      account = vnode.attrs.user;
      profile = app.profiles.getProfile(account.chain.id, account.address);
      role = app.user.isAdminOrMod({ account });
    }
    const roleTag = role ? m(Tag, {
      class: 'roleTag',
      label: role.permission,
      rounded: true,
      size: 'sm',
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
        (account instanceof SubstrateAccount && app.chain?.loaded)
          // substrate name
          ? m(SubstrateIdentityWidget, { account, linkify, profile, hideIdentityIcon }) : [
            // non-substrate name
            linkify
              ? link(`a.user-display-name${
                (profile && profile.displayName !== 'Anonymous') ? '.username' : '.anonymous'}`,
              profile ? `/${profile.chain}/account/${profile.address}` : 'javascript:',
              profile ? profile.displayName : '--',)
              : m('a.user-display-name.username', profile ? profile.displayName : '--')
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
        (account instanceof SubstrateAccount && app.chain?.loaded)
          ? m(SubstrateIdentityWidget, { account, linkify: true, profile, hideIdentityIcon })
          : link(`a.user-display-name${
            (profile && profile.displayName !== 'Anonymous') ? '.username' : '.anonymous'}`,
          profile ? `/${profile.chain}/account/${profile.address}` : 'javascript:',
          profile ? profile.displayName : '--',)
      ]),
      m('.user-address', formatAddressShort(profile.address)),
      roleTag,
    ]);

    return tooltip
      ? m(Tooltip, { content: tooltipPopover, hoverOpenDelay: 1000, trigger: userFinal, key: profile?.address || '-' })
      : userFinal;
  }
};

export const UserBlock: m.Component<{
  user: Account<any>,
  hideIdentityIcon?: boolean,
  tooltip?: boolean,
  showRole?: boolean,
  selected?: boolean,
  compact?: boolean,
}> = {
  view: (vnode) => {
    const { user, hideIdentityIcon, tooltip, showRole, selected, compact } = vnode.attrs;

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
          class: user.profile?.address ? '' : 'no-address',
        }, [
          user.profile?.address && formatAddressShort(user.profile.address),
          !app.chain && ` (${user.chain.id})`,
        ]),
      ]),
      m('.user-block-right', [
        m('.user-block-selected', selected ? '✓' : ''),
      ]),
    ]);
  }
};

export default User;

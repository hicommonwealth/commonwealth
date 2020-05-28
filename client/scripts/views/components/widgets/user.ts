/* eslint-disable no-script-url */
import 'components/widgets/user.scss';

import { default as m } from 'mithril';
import { default as _ } from 'lodash';
import { formatAddressShort, link } from 'helpers';

import app from 'state';
import { Account, Profile } from 'models';
import Tooltip from 'views/components/tooltip';

import { makeDynamicComponent } from 'models/mithril';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import Substrate from 'controllers/chain/substrate/main';
import SubstrateIdentity, { IdentityQuality } from 'controllers/chain/substrate/identity';

interface IAttrs {
  user: Account<any> | [string, string];
  avatarSize?: number;
  avatarOnly?: boolean; // avatarOnly overrides most other properties
  hideAvatar?: boolean;
  linkify?: boolean;
  onclick?: any;
  tooltip?: boolean;
}

export interface ISubstrateIdentityAttrs {
  account: Account<any>;
  linkify: boolean;
  profile: Profile;
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
    const displayName = vnode.state.dynamic.identity?.username;
    const quality = vnode.state.dynamic.identity?.quality;
    if (displayName && quality) {
      const name = [ m(`span.identity-icon${
        quality === IdentityQuality.Good ? '.icon-ok-circled' : '.icon-minus-circled'
      }${quality === IdentityQuality.Good
        ? '.green' : quality === IdentityQuality.Bad
          ? '.red' : '.gray'}`), displayName ];

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
    const { avatarOnly, hideAvatar, user, linkify, tooltip } = vnode.attrs;
    const avatarSize = vnode.attrs.avatarSize || 16;
    const showAvatar = !hideAvatar;
    if (!user) return;

    let account : Account<any>;
    let profile; // profile is used to retrieve the chain and address later

    if (vnode.attrs.user instanceof Array) {
      const chainId = vnode.attrs.user[1];
      const address = vnode.attrs.user[0];
      if (!chainId || !address) return;
      const chain = app.config.chains.getById(chainId);
      // only load account if it's possible to, using the current chain
      if (app.chain && app.chain.id === chainId) {
        account = app.chain.accounts.get(address);
      }
      profile = app.profiles.getProfile(chainId, address);
    } else {
      account = vnode.attrs.user;
      profile = app.profiles.getProfile(account.chain.id, account.address);
    }

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
        (account instanceof SubstrateAccount && app.chain.loaded)
          // substrate name
          ? m(SubstrateIdentityWidget, { account, linkify, profile }) : [
            // non-substrate name
            linkify
              ? link(`a.user-display-name${
                (profile && profile.displayName !== 'Anonymous') ? '.username' : '.anonymous'}`,
              profile ? `/${profile.chain}/account/${profile.address}` : 'javascript:',
              profile ? profile.displayName : '--',)
              : m('a.user-display-name.username', profile ? profile.displayName : '--')
          ]
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
        (account instanceof SubstrateAccount && app.chain.loaded)
          ? m(SubstrateIdentityWidget, { account, linkify: true, profile })
          : link(`a.user-display-name${
            (profile && profile.displayName !== 'Anonymous') ? '.username' : '.anonymous'}`,
          profile ? `/${profile.chain}/account/${profile.address}` : 'javascript:',
          profile ? profile.displayName : '--',)
      ]),
      m('.user-address', formatAddressShort(profile.address)),
    ]);

    return tooltip ? m(Tooltip, { content: tooltipPopover }, userFinal) : userFinal;
  }
};

export default User;

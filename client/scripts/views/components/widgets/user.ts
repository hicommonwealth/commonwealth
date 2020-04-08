import 'components/widgets/user.scss';

import { default as m } from 'mithril';
import { default as _ } from 'lodash';
import { formatAddressShort, link } from 'helpers';

import app from 'state';
import { Account, Profile } from 'models';
import Tooltip from 'views/components/tooltip';

import { makeDynamicComponent } from 'models/mithril';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { Registration } from '@polkadot/types/interfaces';
import { Data } from '@polkadot/types/primitive';
import { u8aToString } from '@polkadot/util';

interface IAttrs {
  user: Account<any> | [string, string];
  avatarSize?: number;
  avatarOnly?: boolean; // avatarOnly overrides most other properties
  hideAvatar?: boolean;
  hideIdentityIcon?: boolean; // only applies to substrate identities
  linkify?: boolean;
  onclick?: any;
  tooltip?: boolean;
}

export interface ISubstrateIdentityAttrs {
  account: Account<any>;
  linkify: boolean;
  profile: Profile;
  hideIdentityIcon: boolean; // only applies to substrate identities
}

export interface ISubstrateIdentityState {
  dynamic: {
    identity: Registration | null;
  },
}

const SubstrateIdentity = makeDynamicComponent<ISubstrateIdentityAttrs, ISubstrateIdentityState>({
  getObservables: (attrs) => ({
    groupKey: attrs.account.address,
    identity: (attrs.account instanceof SubstrateAccount) ? attrs.account.identity : null,
  }),
  view: (vnode) => {
    const { profile, linkify, account, hideIdentityIcon } = vnode.attrs;

    // return polkadot identity if possible
    const displayNameHex = vnode.state.dynamic.identity?.info?.display;
    const judgements = vnode.state.dynamic.identity?.judgements?.toArray() || [];
    if (displayNameHex && judgements) {
      // Polkadot identity judgements. See:
      // https://github.com/polkadot-js/apps/blob/master/packages/react-components/src/AccountName.tsx#L126
      // https://github.com/polkadot-js/apps/blob/master/packages/react-components/src/AccountName.tsx#L182
      const isGood = _.some(judgements, (j) => j[1].toString() === 'KnownGood' || j[1].toString() === 'Reasonable')
      const isBad = _.some(judgements, (j) => j[1].toString() === 'Erroneous' || j[1].toString() === 'LowQuality')
      const d2s = (d: Data) => u8aToString(d.toU8a()).replace(/[^\x20-\x7E]/g, '');
      const name = [
        !hideIdentityIcon && m('span.identity-icon' +
                                           (isGood ? '.icon-ok-circled' : '.icon-minus-circled') +
                                           (isGood ? '.green' : isBad ? '.red' : '.gray')),
        d2s(displayNameHex)
      ];

      return linkify ?
        link(
          'a.user-display-name.username.onchain-username',
          profile ? `/${profile.chain}/account/${profile.address}` : 'javascript:',
          name
        ) :
        m('a.user-display-name.username.onchain-username', name);
    }

    // return offchain name while identity is loading
    return linkify ?
      link('a.user-display-name' +
           ((profile && profile.displayName !== 'Anonymous') ? '.username' : '.anonymous'),
           profile ? `/${profile.chain}/account/${profile.address}` : 'javascript:',
           profile ? profile.displayName : '--',
          ) :
      m('a.user-display-name.username', profile ? profile.displayName : '--');
  }
});

const User : m.Component<IAttrs> = {
  view: (vnode) => {
    const { avatarOnly, hideAvatar, hideIdentityIcon, user, linkify, tooltip } = vnode.attrs;
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

    const userFinal = avatarOnly ?
      m('.User.avatar-only', {
        key: profile?.address || '-',
      }, [
        m('.user-avatar-only', { style: `width: ${avatarSize}px; height: ${avatarSize}px;`, }, [
          !profile ? null :
            profile.avatarUrl ?
            profile.getAvatar(avatarSize) :
            profile.getAvatar(avatarSize - 4)
        ]),
      ]) :
      m('.User', {
        key: profile?.address || '-',
        class: linkify ? 'linkified' : '',
      }, [
        showAvatar && m('.user-avatar', {
          style: `width: ${avatarSize}px; height: ${avatarSize}px;`,
        }, profile && profile.getAvatar(avatarSize)),
        (account instanceof SubstrateAccount && account.identity) ?
          // substrate name
          m(SubstrateIdentity, { account, linkify, profile, hideIdentityIcon }) : [
            // non-substrate name
            linkify ?
              link('a.user-display-name' +
                   ((profile && profile.displayName !== 'Anonymous') ? '.username' : '.anonymous'),
                   profile ? `/${profile.chain}/account/${profile.address}` : 'javascript:',
                   profile ? profile.displayName : '--',
                  ) :
              m('a.user-display-name.username', profile ? profile.displayName : '--')
            ]
      ]);

    const tooltipPopover = m('.UserTooltip', {
      onclick: (e) => {
        e.stopPropagation();
      }
    }, [
      m('.user-avatar', [
          !profile ? null :
            profile.avatarUrl ?
            profile.getAvatar(36) :
            profile.getAvatar(32)
      ]),
      m('.user-name', [
        (account instanceof SubstrateAccount && account.identity) ?
          m(SubstrateIdentity, { account, linkify: true, profile, hideIdentityIcon }) :
          link('a.user-display-name' +
               ((profile && profile.displayName !== 'Anonymous') ? '.username' : '.anonymous'),
               profile ? `/${profile.chain}/account/${profile.address}` : 'javascript:',
               profile ? profile.displayName : '--',
              )
      ]),
      m('.user-address', formatAddressShort(profile.address)),
    ]);

    return tooltip ? m(Tooltip, { content: tooltipPopover }, userFinal) : userFinal;
  }
};

export default User;

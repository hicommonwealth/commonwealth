/* eslint-disable no-script-url */
import 'components/widgets/user.scss';

import m from 'mithril';
import _ from 'lodash';
import { link } from 'helpers';

import app from 'state';
import { Account, Profile } from 'models';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import Substrate from 'controllers/chain/substrate/main';
import SubstrateIdentity, { IdentityQuality, getIdentityQuality } from 'controllers/chain/substrate/identity';
import { formatAddressShort } from '../../../../../shared/utils';

export interface ISubstrateIdentityAttrs {
  account: Account<any>;
  linkify: boolean;
  profile: Profile;
  hideIdentityIcon: boolean; // only applies to substrate identities, also hides councillor icon
  showAddressWithDisplayName?: boolean;
  addrShort: string;
}

export interface ISubstrateIdentityState {
  identity: SubstrateIdentity | null;
}

const SubstrateOnlineIdentityWidget: m.Component<ISubstrateIdentityAttrs, ISubstrateIdentityState> = {
  oninit: (vnode) => {
    app.runWhenReady(async () => {
      vnode.state.identity = (vnode.attrs.account instanceof SubstrateAccount
          && !vnode.attrs.profile.isOnchain
          && (app.chain as Substrate).identities)
        ? await (app.chain as Substrate).identities.load(vnode.attrs.account)
        : null;
      m.redraw();
    });
  },
  view: (vnode) => {
    const { profile, linkify, account, addrShort, hideIdentityIcon, showAddressWithDisplayName } = vnode.attrs;
    // if invalidated by change, load the new identity immediately
    vnode.state.identity = ((!profile.isOnchain || profile.isNameInvalid)
      && (app.chain as Substrate).identities)
      ? (app.chain as Substrate).identities.get(account.address)
      : null;

    // return polkadot identity if possible
    let displayName;
    let quality: IdentityQuality;
    if (profile.isOnchain && !profile.isNameInvalid) {
      // first try to use identity fetched from server
      displayName = showAddressWithDisplayName
        ? [ profile.displayName, m('.id-short', formatAddressShort(profile.address, profile.chain)) ]
        : profile.displayName;
      quality = getIdentityQuality(Object.values(profile.judgements));
    } else if (vnode.state.identity?.exists) {
      // then attempt to use identity fetched from chain
      displayName = showAddressWithDisplayName
        ? [ vnode.state.identity.username, m('.id-short', formatAddressShort(profile.address, profile.chain)) ]
        : vnode.state.identity.username;
      quality = vnode.state.identity.quality;
    }

    if (displayName && quality) {
      const name = [ displayName, !hideIdentityIcon && m(`span.identity-icon${quality === IdentityQuality.Good
        ? '.green' : quality === IdentityQuality.Bad
          ? '.red' : '.gray'}`, [
        quality === IdentityQuality.Good ? '✓' : quality === IdentityQuality.Bad ? '✗' : '-'
      ]) ];

      return linkify
        ? link(
          `a.user-display-name.username.onchain-username${IdentityQuality.Good ? '.verified' : ''}`,
          profile ? `/${m.route.param('scope')}/account/${profile.address}?base=${profile.chain}` : 'javascript:',
          name
        )
        : m(`a.user-display-name.username.onchain-username${IdentityQuality.Good ? '.verified' : ''}`, name);
    }

    // return offchain name while identity is loading
    return linkify
      ? link('a.user-display-name.username',
        profile ? `/${m.route.param('scope')}/account/${profile.address}?base=${profile.chain}` : 'javascript:',
        !profile ? addrShort : !showAddressWithDisplayName ? profile.displayName : [
          profile.displayName,
          m('.id-short', formatAddressShort(profile.address, profile.chain)),
        ])
      : m('a.user-display-name.username', [
        !profile ? addrShort : !showAddressWithDisplayName ? profile.displayName : [
          profile.displayName,
          m('.id-short', formatAddressShort(profile.address, profile.chain)),
        ],
      ]);
  }
};

const SubstrateOfflineIdentityWidget: m.Component<ISubstrateIdentityAttrs, ISubstrateIdentityState> = {
  view: (vnode) => {
    const { profile, linkify, account, addrShort, hideIdentityIcon, showAddressWithDisplayName } = vnode.attrs;

    const quality = profile?.isOnchain && profile?.name && getIdentityQuality(Object.values(profile.judgements));

    if (profile?.isOnchain && profile?.name && quality && !hideIdentityIcon) {
      const name = [
        showAddressWithDisplayName
          ? [ profile.name, m('.id-short', formatAddressShort(profile.address, profile.chain)) ]
          : profile.name,
        m(`span.identity-icon${quality === IdentityQuality.Good
          ? '.green' : quality === IdentityQuality.Bad
            ? '.red' : '.gray'}`, [
          quality === IdentityQuality.Good ? '✓' : quality === IdentityQuality.Bad ? '✗' : '-'
        ])
      ];

      return linkify
        ? link(
          `a.user-display-name.username.onchain-username${IdentityQuality.Good ? '.verified' : ''}`,
          profile ? `/${m.route.param('scope')}/account/${profile.address}?base=${profile.chain}` : 'javascript:',
          name
        )
        : m(`a.user-display-name.username.onchain-username${IdentityQuality.Good ? '.verified' : ''}`, name);
    }

    // return offchain name while identity is loading
    return linkify
      ? link('a.user-display-name.username',
        profile ? `/${m.route.param('scope')}/account/${profile.address}?base=${profile.chain}` : 'javascript:',
        !profile ? addrShort : !showAddressWithDisplayName ? profile.displayName : [
          profile.displayName,
          m('.id-short', formatAddressShort(profile.address, profile.chain)),
        ])
      : m('a.user-display-name.username', [
        !profile ? addrShort : !showAddressWithDisplayName ? profile.displayName : [
          profile.displayName,
          m('.id-short', formatAddressShort(profile.address, profile.chain)),
        ],
      ]);
  }
};

const SubstrateIdentityWidget: m.Component<ISubstrateIdentityAttrs, ISubstrateIdentityState> = {
  view: (vnode) => {
    if (app.chain?.loaded && vnode.attrs.account && (app.chain as Substrate).identities?.initialized) {
      return m(SubstrateOnlineIdentityWidget, vnode.attrs);
    } else {
      return m(SubstrateOfflineIdentityWidget, vnode.attrs);
    }
  }
};

export default SubstrateIdentityWidget;

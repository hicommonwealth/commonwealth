/* eslint-disable no-script-url */
import 'components/widgets/user.scss';

import m from 'mithril';
import _ from 'lodash';
import { link } from 'helpers';

import app from 'state';
import { Account, Profile } from 'models';

import { makeDynamicComponent } from 'models/mithril';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import Substrate from 'controllers/chain/substrate/main';
import SubstrateIdentity, { IdentityQuality } from 'controllers/chain/substrate/identity';

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
          profile ? `/${m.route.param('scope')}/account/${profile.address}?base=${profile.chain}` : 'javascript:',
          name
        )
        : m('a.user-display-name.username.onchain-username', name);
    }

    // return offchain name while identity is loading
    return linkify
      ? link(`a.user-display-name${(profile && profile.displayName !== 'Anonymous') ? '.username' : '.anonymous'}`,
        profile ? `/${m.route.param('scope')}/account/${profile.address}?base=${profile.chain}` : 'javascript:',
        profile ? profile.displayName : '--',)
      : m('a.user-display-name.username', profile ? profile.displayName : '--');
  }
});

export default SubstrateIdentityWidget;

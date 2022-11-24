/* eslint-disable no-script-url */
import 'components/widgets/user.scss';

import m from 'mithril';
import ClassComponent from 'class_component';
import _ from 'lodash';
import { link } from 'helpers';

import app from 'state';
import { Account, Profile } from 'models';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import Substrate from 'controllers/chain/substrate/adapter';
import SubstrateIdentity, {
  IdentityQuality,
  getIdentityQuality,
} from 'controllers/chain/substrate/identity';
import { formatAddressShort } from '../../../../../shared/utils';

export type ISubstrateIdentityAttrs = {
  account: Account;
  linkify: boolean;
  profile: Profile;
  hideIdentityIcon: boolean; // only applies to substrate identities, also hides councillor icon
  showAddressWithDisplayName?: boolean;
  addrShort: string;
}

class SubstrateOnlineIdentityWidget extends ClassComponent<
  ISubstrateIdentityAttrs
> {
  private identity: SubstrateIdentity | null;

  public oninit(vnode) {
    app.runWhenReady(async () => {
      this.identity =
        vnode.attrs.account instanceof SubstrateAccount &&
        !vnode.attrs.profile.isOnchain &&
        (app.chain as Substrate).identities
          ? await (app.chain as Substrate).identities.load(vnode.attrs.account)
          : null;
      m.redraw();
    });
  }
  public view(vnode) {
    const {
      profile,
      linkify,
      account,
      addrShort,
      hideIdentityIcon,
      showAddressWithDisplayName,
    } = vnode.attrs;
    // if invalidated by change, load the new identity immediately
    this.identity =
      (!profile.isOnchain || profile.isNameInvalid) &&
      (app.chain as Substrate).identities
        ? (app.chain as Substrate).identities.get(account.address)
        : null;

    // return polkadot identity if possible
    let displayName;
    let quality: IdentityQuality;
    if (profile.isOnchain && !profile.isNameInvalid) {
      // first try to use identity fetched from server
      displayName = showAddressWithDisplayName
        ? [
            profile.displayName,
            m('.id-short', formatAddressShort(profile.address, profile.chain)),
          ]
        : profile.displayName;
      quality = getIdentityQuality(Object.values(profile.judgements));
    } else if (this.identity?.exists) {
      // then attempt to use identity fetched from chain
      displayName = showAddressWithDisplayName
        ? [
            this.identity.username,
            m('.id-short', formatAddressShort(profile.address, profile.chain)),
          ]
        : this.identity.username;
      quality = this.identity.quality;
    }

    if (displayName && quality) {
      const name = [
        displayName,
        !hideIdentityIcon &&
          m(
            `span.identity-icon${
              quality === IdentityQuality.Good
                ? '.green'
                : quality === IdentityQuality.Bad
                ? '.red'
                : '.gray'
            }`,
            [
              quality === IdentityQuality.Good
                ? '✓'
                : quality === IdentityQuality.Bad
                ? '✗'
                : '-',
            ]
          ),
      ];

      return linkify
        ? link(
            `a.user-display-name.username.onchain-username${
              IdentityQuality.Good ? '.verified' : ''
            }`,
            profile
              ? `/${app.activeChainId()}/account/${profile.address}?base=${
                  profile.chain
                }`
              : 'javascript:',
            name
          )
        : m(
            `a.user-display-name.username.onchain-username${
              IdentityQuality.Good ? '.verified' : ''
            }`,
            name
          );
    }

    // return name while identity is loading
    return linkify
      ? link(
          'a.user-display-name.username',
          profile
            ? `/${app.activeChainId()}/account/${profile.address}?base=${
                profile.chain
              }`
            : 'javascript:',
          !profile
            ? addrShort
            : !showAddressWithDisplayName
            ? profile.displayName
            : [
                profile.displayName,
                m(
                  '.id-short',
                  formatAddressShort(profile.address, profile.chain)
                ),
              ]
        )
      : m('a.user-display-name.username', [
          !profile
            ? addrShort
            : !showAddressWithDisplayName
            ? profile.displayName
            : [
                profile.displayName,
                m(
                  '.id-short',
                  formatAddressShort(profile.address, profile.chain)
                ),
              ],
        ]);
  }
}

class SubstrateOfflineIdentityWidget extends ClassComponent<
  ISubstrateIdentityAttrs
> {
  private identity: SubstrateIdentity | null;

  public view(vnode) {
    const {
      profile,
      linkify,
      account,
      addrShort,
      hideIdentityIcon,
      showAddressWithDisplayName,
    } = vnode.attrs;

    const quality =
      profile?.isOnchain &&
      profile?.name &&
      getIdentityQuality(Object.values(profile.judgements));

    if (profile?.isOnchain && profile?.name && quality && !hideIdentityIcon) {
      const name = [
        showAddressWithDisplayName
          ? [
              profile.name,
              m(
                '.id-short',
                formatAddressShort(profile.address, profile.chain)
              ),
            ]
          : profile.name,
        m(
          `span.identity-icon${
            quality === IdentityQuality.Good
              ? '.green'
              : quality === IdentityQuality.Bad
              ? '.red'
              : '.gray'
          }`,
          [
            quality === IdentityQuality.Good
              ? '✓'
              : quality === IdentityQuality.Bad
              ? '✗'
              : '-',
          ]
        ),
      ];

      return linkify
        ? link(
            `a.user-display-name.username.onchain-username${
              IdentityQuality.Good ? '.verified' : ''
            }`,
            profile
              ? `/${app.activeChainId()}/account/${profile.address}?base=${
                  profile.chain
                }`
              : 'javascript:',
            name
          )
        : m(
            `a.user-display-name.username.onchain-username${
              IdentityQuality.Good ? '.verified' : ''
            }`,
            name
          );
    }

    // return offchain name while identity is loading
    return linkify
      ? link(
          'a.user-display-name.username',
          profile
            ? `/${app.activeChainId()}/account/${profile.address}?base=${
                profile.chain
              }`
            : 'javascript:',
          !profile
            ? addrShort
            : !showAddressWithDisplayName
            ? profile.displayName
            : [
                profile.displayName,
                m(
                  '.id-short',
                  formatAddressShort(profile.address, profile.chain)
                ),
              ]
        )
      : m('a.user-display-name.username', [
          !profile
            ? addrShort
            : !showAddressWithDisplayName
            ? profile.displayName
            : [
                profile.displayName,
                m(
                  '.id-short',
                  formatAddressShort(profile.address, profile.chain)
                ),
              ],
        ]);
  }
}

class SubstrateIdentityWidget extends ClassComponent<
  ISubstrateIdentityAttrs
> {
  public view(vnode) {
    if (
      app.chain?.loaded &&
      vnode.attrs.account &&
      (app.chain as Substrate).identities?.initialized
    ) {
      return m(SubstrateOnlineIdentityWidget, vnode.attrs);
    } else {
      return m(SubstrateOfflineIdentityWidget, vnode.attrs);
    }
  }
}

export default SubstrateIdentityWidget;

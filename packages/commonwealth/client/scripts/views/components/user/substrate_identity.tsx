/* @jsx jsx */
/* eslint-disable no-script-url */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';

import 'components/user/user.scss';

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

type SubstrateIdentityAttrs = {
  account: Account;
  addrShort: string;
  hideIdentityIcon: boolean; // only applies to substrate identities, also hides councillor icon
  linkify: boolean;
  profile: Profile;
  showAddressWithDisplayName?: boolean;
};

class SubstrateOnlineIdentityWidget extends ClassComponent<SubstrateIdentityAttrs> {
  private identity: SubstrateIdentity | null;

  oninit(vnode: ResultNode<SubstrateIdentityAttrs>) {
    app.runWhenReady(async () => {
      this.identity =
        vnode.attrs.account instanceof SubstrateAccount &&
        !vnode.attrs.profile.isOnchain &&
        (app.chain as Substrate).identities
          ? await (app.chain as Substrate).identities.load(vnode.attrs.account)
          : null;
      redraw();
    });
  }

  view(vnode: ResultNode<SubstrateIdentityAttrs>) {
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
      displayName = showAddressWithDisplayName ? (
        <>
          {profile.displayName}
          <div className="id-short">
            {formatAddressShort(profile.address, profile.chain)}
          </div>
        </>
      ) : (
        profile.displayName
      );
      quality = getIdentityQuality(Object.values(profile.judgements));
    } else if (this.identity?.exists) {
      // then attempt to use identity fetched from chain
      displayName = showAddressWithDisplayName ? (
        <>
          {this.identity.username}
          <div className="id-short">
            {formatAddressShort(profile.address, profile.chain)}
          </div>
        </>
      ) : (
        this.identity.username
      );
      quality = this.identity.quality;
    }

    if (displayName && quality) {
      const name = (
        <>
          {displayName}
          {!hideIdentityIcon && (
            <span
              className={`identity-icon${
                quality === IdentityQuality.Good
                  ? '.green'
                  : quality === IdentityQuality.Bad
                  ? '.red'
                  : '.gray'
              }`}
            >
              {quality === IdentityQuality.Good
                ? '✓'
                : quality === IdentityQuality.Bad
                ? '✗'
                : '-'}
            </span>
          )}
        </>
      );

      return linkify ? (
        link(
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
      ) : (
        <a
          className={`user-display-name username onchain-username${
            IdentityQuality.Good ? ' verified' : ''
          }`}
        >
          {name}
        </a>
      );
    }

    // return name while identity is loading
    return linkify ? (
      link(
        'a.user-display-name.username',
        profile
          ? `/${app.activeChainId()}/account/${profile.address}?base=${
              profile.chain
            }`
          : 'javascript:',
        !profile ? (
          addrShort
        ) : !showAddressWithDisplayName ? (
          profile.displayName
        ) : (
          <>
            {profile.displayName}
            <div className="id-short">
              {formatAddressShort(profile.address, profile.chain)}
            </div>
          </>
        )
      )
    ) : (
      <a className="user-display-name username">
        {!profile ? (
          addrShort
        ) : !showAddressWithDisplayName ? (
          profile.displayName
        ) : (
          <>
            {profile.displayName}
            <div className="id-short">
              {formatAddressShort(profile.address, profile.chain)}
            </div>
          </>
        )}
      </a>
    );
  }
}

class SubstrateOfflineIdentityWidget extends ClassComponent<SubstrateIdentityAttrs> {
  private identity: SubstrateIdentity | null;

  view(vnode: ResultNode<SubstrateIdentityAttrs>) {
    const {
      addrShort,
      hideIdentityIcon,
      linkify,
      profile,
      showAddressWithDisplayName,
    } = vnode.attrs;

    const quality =
      profile?.isOnchain &&
      profile?.name &&
      getIdentityQuality(Object.values(profile.judgements));

    if (profile?.isOnchain && profile?.name && quality && !hideIdentityIcon) {
      const name = (
        <>
          {showAddressWithDisplayName ? (
            <>
              {profile.name}
              <div className="id-short">
                {formatAddressShort(profile.address, profile.chain)}
              </div>
            </>
          ) : (
            profile.name
          )}
          <span
            className={`identity-icon${
              quality === IdentityQuality.Good
                ? '.green'
                : quality === IdentityQuality.Bad
                ? '.red'
                : '.gray'
            }`}
          >
            {quality === IdentityQuality.Good
              ? '✓'
              : quality === IdentityQuality.Bad
              ? '✗'
              : '-'}
          </span>
        </>
      );

      return linkify ? (
        link(
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
      ) : (
        <a
          className={`user-display-name username onchain-username${
            IdentityQuality.Good ? ' verified' : ''
          }`}
        >
          {name}
        </a>
      );
    }

    // return offchain name while identity is loading
    return linkify ? (
      link(
        'a.user-display-name.username',
        profile
          ? `/${app.activeChainId()}/account/${profile.address}?base=${
              profile.chain
            }`
          : 'javascript:',
        !profile ? (
          addrShort
        ) : !showAddressWithDisplayName ? (
          profile.displayName
        ) : (
          <>
            {profile.displayName}
            <div className="id-short">
              {formatAddressShort(profile.address, profile.chain)}
            </div>
          </>
        )
      )
    ) : (
      <a className="user-display-name username">
        {!profile ? (
          addrShort
        ) : !showAddressWithDisplayName ? (
          profile.displayName
        ) : (
          <>
            {profile.displayName}
            <div className="id-short">
              {formatAddressShort(profile.address, profile.chain)}
            </div>
          </>
        )}
      </a>
    );
  }
}

class SubstrateIdentityWidget extends ClassComponent<SubstrateIdentityAttrs> {
  private identity: SubstrateIdentity | null;

  view(vnode: ResultNode<SubstrateIdentityAttrs>) {
    if (
      app.chain?.loaded &&
      vnode.attrs.account &&
      (app.chain as Substrate).identities?.initialized
    ) {
      return <SubstrateOnlineIdentityWidget {...vnode.attrs} />;
    } else {
      return <SubstrateOfflineIdentityWidget {...vnode.attrs} />;
    }
  }
}

export default SubstrateIdentityWidget;

/* eslint-disable no-script-url */
import React from 'react';

import { capitalize } from 'lodash';

import 'components/user/user.scss';

import app from 'state';
import type { Account } from 'models';
import { AddressInfo, Profile } from 'models';
import { formatAddressShort } from '../../../../../shared/utils';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { User } from './user';
import type { AddressDisplayOptions } from './user';
import { getClasses } from '../component_kit/helpers';

export const UserBlock = (props: {
  addressDisplayOptions?: AddressDisplayOptions;
  avatarSize?: number;
  compact?: boolean;
  hideOnchainRole?: boolean;
  popover?: boolean;
  searchTerm?: string;
  selected?: boolean;
  showAddressWithDisplayName?: boolean;
  showChainName?: boolean;
  showRole?: boolean;
  user: Account | AddressInfo | Profile;
}) => {
  const {
    addressDisplayOptions,
    avatarSize,
    compact,
    popover,
    searchTerm,
    selected,
    showAddressWithDisplayName,
    showChainName,
    showRole,
    user,
  } = props;

  const { showFullAddress } = addressDisplayOptions || {};

  let profile;

  if (user instanceof AddressInfo) {
    if (!user.chain || !user.address) return;
    profile = app.profiles.getProfile(user.chain.id, user.address);
  } else if (user instanceof Profile) {
    profile = user;
  } else {
    profile = app.profiles.getProfile(user.chain.id, user.address);
  }

  const highlightSearchTerm =
    profile?.address &&
    searchTerm &&
    profile.address.toLowerCase().includes(searchTerm);

  const highlightedAddress = highlightSearchTerm
    ? (() => {
        const queryStart = profile.address.toLowerCase().indexOf(searchTerm);
        const queryEnd = queryStart + searchTerm.length;

        return (
          <>
            <span>{profile.address.slice(0, queryStart)}</span>
            <mark>{profile.address.slice(queryStart, queryEnd)}</mark>
            <span>
              {profile.address.slice(queryEnd, profile.address.length)}
            </span>
          </>
        );
      })()
    : null;

  const children = (
    <>
      <div className="user-block-left">
        <User
          user={user}
          avatarOnly
          avatarSize={avatarSize || 28}
          popover={popover}
        />
      </div>
      <div className="user-block-center">
        <div className="user-block-name">
          <User
            user={user}
            hideAvatar
            showAddressWithDisplayName={showAddressWithDisplayName}
            addressDisplayOptions={addressDisplayOptions}
            popover={popover}
            showRole={showRole}
          />
        </div>
        <div
          className={`user-block-address${
            profile?.address ? '' : 'no-address'
          }`}
        >
          <div>
            {highlightSearchTerm
              ? highlightedAddress
              : showFullAddress
              ? profile.address
              : formatAddressShort(profile.address, profile.chain)}
          </div>
          {profile?.address && showChainName && (
            <div className="address-divider"> · </div>
          )}
          {showChainName && (
            <div>
              {typeof user.chain === 'string'
                ? capitalize(user.chain)
                : capitalize(user.chain.name)}
            </div>
          )}
        </div>
      </div>
      <div className="user-block-right">
        <div className="user-block-selected">
          {selected ? <CWIcon iconName="check" /> : ''}
        </div>
      </div>
    </>
  );

  return (
    <div
      className={getClasses<{ compact?: boolean }>({ compact }, 'UserBlock')}
    >
      {children}
    </div>
  );
};

/* eslint-disable no-script-url */
import React from 'react';

import { capitalize } from 'lodash';

import 'components/user/user.scss';

import app from 'state';
import type { Account } from 'models';
import { AddressInfo } from 'models';
import MinimumProfile from '../../../models/MinimumProfile';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
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
  user: Account | AddressInfo | MinimumProfile;
  hideAvatar?: boolean;
}) => {
  const { compact, searchTerm, showChainName, user } = props;

  let profile;

  if (user instanceof AddressInfo) {
    if (!user.chain || !user.address) return;
    profile = app.newProfiles.getProfile(user.chain.id, user.address);
  } else if (user instanceof MinimumProfile) {
    profile = user;
  } else {
    profile = app.newProfiles.getProfile(user.chain.id, user.address);
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
      <div className="user-block-center">
        <div
          className={`user-block-address${
            profile?.address ? '' : 'no-address'
          }`}
        >
          <div>
            {highlightSearchTerm
              ? highlightedAddress
              : `${profile.address.slice(0, 8)}...${profile.address.slice(-5)}`}
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
          <CWIcon iconName="check" iconSize="small" />
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

/* eslint-disable react/no-multi-comp */
/* eslint-disable no-script-url */
import { WalletId } from '@hicommonwealth/shared';
import 'components/user/user.scss';
import _ from 'lodash';
import React from 'react';
import app from 'state';
import { useFetchProfilesByAddressesQuery } from 'state/api/profiles';
import Account from '../../../models/Account';
import AddressInfo from '../../../models/AddressInfo';
import MinimumProfile from '../../../models/MinimumProfile';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { getClasses } from '../component_kit/helpers';

export const formatAddress = (address: string) => {
  return `${address.slice(0, 8)}...${address.slice(-5)}`;
};

type UserProps = {
  avatarSize?: number;
  compact?: boolean;
  hideOnchainRole?: boolean;
  popover?: boolean;
  searchTerm?: string;
  selected?: boolean;
  showAddressWithDisplayName?: boolean;
  showCommunityName?: boolean;
  showRole?: boolean;
  showLoginMethod?: boolean;
  user: Account | AddressInfo | MinimumProfile;
  hideAvatar?: boolean;
};

export const UserBlock = ({
  compact,
  searchTerm,
  showCommunityName,
  showLoginMethod,
  user,
  selected,
}: UserProps) => {
  let userCommunityId: string;
  if (user instanceof MinimumProfile) {
    userCommunityId = user.chain;
  } else if (user instanceof Account) {
    userCommunityId = user.community.id;
  }
  const { data: users } = useFetchProfilesByAddressesQuery({
    profileChainIds: [userCommunityId],
    profileAddresses: [user?.address],
    currentChainId: app.activeChainId(),
    apiCallEnabled: !!(userCommunityId && user?.address),
  });
  const profile = users?.[0];

  const highlightSearchTerm =
    profile?.address &&
    searchTerm &&
    profile?.address.toLowerCase().includes(searchTerm);

  const highlightedAddress = highlightSearchTerm
    ? (() => {
        const queryStart = profile?.address.toLowerCase().indexOf(searchTerm);
        const queryEnd = queryStart + searchTerm.length;

        return (
          <>
            <span>{profile?.address.slice(0, queryStart)}</span>
            <mark>{profile?.address.slice(queryStart, queryEnd)}</mark>
            <span>
              {profile?.address.slice(queryEnd, profile?.address.length)}
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
              : `${profile?.address.slice(0, 8)}...${profile?.address.slice(
                  -5,
                )}`}
          </div>
          {profile?.address && showCommunityName && (
            <div className="address-divider"> · </div>
          )}
          {showCommunityName && (
            <div>
              {user instanceof MinimumProfile
                ? _.capitalize(user.chain)
                : _.capitalize(user.community.name)}
            </div>
          )}
        </div>
        {showLoginMethod && !(user instanceof MinimumProfile) && (
          <UserLoginBadge user={user} />
        )}
      </div>
      <div className="user-block-right">
        {selected && (
          <div className="user-block-selected">
            <CWIcon iconName="check" iconSize="small" />
          </div>
        )}
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

const UserLoginBadge = ({ user }: { user: Account | AddressInfo }) => {
  const [address, setAddress] = React.useState<AddressInfo>();

  React.useEffect(() => {
    const matchingAddress = app.user.addresses.find(
      (a) =>
        a.community.id === user.community?.id && a.address === user.address,
    );
    if (matchingAddress) {
      setAddress(matchingAddress);
    }
  }, [user.address, user.community?.id]);

  return (
    <>
      {address?.walletId === WalletId.Magic && (
        <div className="user-block-via">via {address.walletSsoSource}</div>
      )}
    </>
  );
};

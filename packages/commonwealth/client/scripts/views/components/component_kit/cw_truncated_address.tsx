import React from 'react';

import './cw_truncated_address.scss';

import clsx from 'clsx';
import { formatAddressShort } from '../../../helpers';
import { CWCommunityAvatar } from './cw_community_avatar';

type TruncatedAddressProps = {
  address?: string;
  communityInfo?: {
    iconUrl: string;
    name: string;
  };
  showCommunityname?: boolean;
};

export const CWTruncatedAddress = ({
  address,
  communityInfo,
  showCommunityname,
}: TruncatedAddressProps) => {
  return (
    <div
      className={clsx('TruncatedAddress', {
        'with-community': communityInfo,
        'no-background': showCommunityname,
      })}
    >
      {communityInfo && (
        <CWCommunityAvatar
          community={{
            iconUrl: communityInfo.iconUrl,
            name: communityInfo.name,
          }}
          size="small"
        />
      )}
      {showCommunityname && communityInfo?.name}
      {address && formatAddressShort(address)}
    </div>
  );
};

import React from 'react';

import './cw_truncated_address.scss';

import { formatAddressShort } from '../../../helpers';
import { CWCommunityAvatar } from './cw_community_avatar';

type TruncatedAddressProps = {
  address: string;
  communityInfo?: {
    iconUrl: string;
    name: string;
  };
};

export const CWTruncatedAddress = ({
  address,
  communityInfo,
}: TruncatedAddressProps) => {
  return (
    <div
      className={
        communityInfo ? 'TruncatedAddress with-community' : 'TruncatedAddress'
      }
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
      {formatAddressShort(address)}
    </div>
  );
};

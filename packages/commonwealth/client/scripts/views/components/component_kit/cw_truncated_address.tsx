import React from 'react';

import 'components/component_kit/cw_truncated_address.scss';

import { formatAddressShort } from '../../../helpers';
import type ChainInfo from '../../../models/ChainInfo';
import { CWCommunityAvatar } from './cw_community_avatar';

type TruncatedAddressProps = {
  address: string;
  communityInfo?: ChainInfo;
};

export const CWTruncatedAddress = (props: TruncatedAddressProps) => {
  const { address, communityInfo } = props;

  return (
    <div
      className={
        communityInfo ? 'TruncatedAddress with-community' : 'TruncatedAddress'
      }
    >
      {communityInfo && (
        <CWCommunityAvatar community={communityInfo} size="small" />
      )}
      {formatAddressShort(address)}
    </div>
  );
};

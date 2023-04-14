import type { ChainInfo } from 'client/scripts/models';

import 'components/component_kit/cw_truncated_address.scss';
import React from 'react';

import { formatAddressShort } from '../../../helpers';
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

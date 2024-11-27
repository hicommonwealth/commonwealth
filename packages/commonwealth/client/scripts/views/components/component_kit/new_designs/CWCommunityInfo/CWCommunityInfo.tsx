import React from 'react';

import { CWCommunityAvatar } from '../../cw_community_avatar';
import './CWCommunityInfo.scss';

type TruncatedAddressProps = {
  address: string;
  communityInfo?: {
    iconUrl: string;
    name: string;
  };
};

export const CWCommunityInfo = ({
  address,
  communityInfo,
}: TruncatedAddressProps) => {
  return (
    <div className="CommunityInfo">
      {communityInfo && (
        <CWCommunityAvatar
          community={{
            iconUrl: communityInfo.iconUrl,
            name: communityInfo.name,
          }}
          size="small"
        />
      )}
      {communityInfo?.name}
    </div>
  );
};

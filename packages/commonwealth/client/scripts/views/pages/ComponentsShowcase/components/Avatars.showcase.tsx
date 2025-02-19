import React from 'react';

import { S3_ASSET_BUCKET_CDN } from '@hicommonwealth/shared';
import ghostImg from 'assets/img/ghost.svg';
import { CWAvatar } from 'views/components/component_kit/cw_avatar';
import { CWCommunityAvatar } from 'views/components/component_kit/cw_community_avatar';
import { CWText } from 'views/components/component_kit/cw_text';

const communityAvatar = {
  name: 'dYdX',
  iconUrl: `https://${S3_ASSET_BUCKET_CDN}/5d4b9152-f45f-4864-83e5-074e0e892688.1627998072164`,
};
const AvatarsShowcase = () => {
  return (
    <>
      <CWText type="h5">Avatar</CWText>
      <div className="flex-row">
        <CWAvatar avatarUrl={ghostImg} size={16} />
        <CWAvatar avatarUrl={ghostImg} size={20} />
        <CWAvatar avatarUrl={ghostImg} size={24} />
        <CWAvatar avatarUrl={ghostImg} size={32} />
      </div>

      <CWText type="h5">Community Avatar</CWText>
      <div className="flex-row">
        <CWCommunityAvatar size="small" community={communityAvatar} />
        <CWCommunityAvatar size="medium" community={communityAvatar} />
        <CWCommunityAvatar size="xl" community={communityAvatar} />
        <CWCommunityAvatar size="xxl" community={communityAvatar} />
      </div>
    </>
  );
};

export default AvatarsShowcase;

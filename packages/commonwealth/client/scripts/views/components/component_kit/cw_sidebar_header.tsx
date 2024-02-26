import React from 'react';

import { navigateToCommunity, useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import { CWCommunityAvatar } from '../component_kit/cw_community_avatar';

export const SidebarHeader = () => {
  const navigate = useCommonNavigate();

  return (
    <div className="SidebarHeader">
      <CWCommunityAvatar
        community={app.chain && app.chain.meta}
        onClick={() => {
          console.log('clicked on community avatar');
          navigateToCommunity({ navigate, path: '', chain: app.chain.id });
        }}
      />
    </div>
  );
};

import React from 'react';

import app from 'state';
import { CWCommunityAvatar } from '../../component_kit/cw_community_avatar';
import { navigateToCommunity, useCommonNavigate } from 'navigation/helpers';

const SidebarHeader = () => {
  const navigate = useCommonNavigate();
  console.log('chian', app.chain);
  return (
    <div
      style={{
        display: 'flex',
        // width: '100%',
        padding: '8px 0px 8px 8px',
        borderTopLeftRadius: 80,
        borderBottomLeftRadius: 80,
        borderLeft: '2px solid #E5E5E5',
        flexDirection: 'row',
        alignItems: 'center',
        borderRight: '1px solid #E5E5E5',
        backgroundColor: '#FFF',
      }}
    >
      <CWCommunityAvatar
        community={app.chain && app.chain.meta}
        onClick={() =>
          navigateToCommunity({ navigate, path: '', chain: app.chain.id })
        }
      />
      <p style={{ padding: 12 }}>{app.chain && app.chain.meta.name}</p>
    </div>
  );
};

export default SidebarHeader;

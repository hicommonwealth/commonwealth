import 'components/component_kit/CWSidebarHeader/CWSidebarHeader.scss';
import React from 'react';

import app from 'state';
import { CWCommunityAvatar } from '../../component_kit/cw_community_avatar';
import { CWText } from '../../component_kit/cw_text';
import { navigateToCommunity, useCommonNavigate } from 'navigation/helpers';

const SidebarHeader = () => {
  const navigate = useCommonNavigate();

  return (
    <div className="SidebarHeader">
      <CWCommunityAvatar
        community={app.chain && app.chain.meta}
        onClick={() =>
          navigateToCommunity({ navigate, path: '', chain: app.chain.id })
        }
      />

      {app.chain && (
        <CWText className="header" type={'h5'}>
          {app.chain.meta.name}
        </CWText>
      )}
    </div>
  );
};

export default SidebarHeader;

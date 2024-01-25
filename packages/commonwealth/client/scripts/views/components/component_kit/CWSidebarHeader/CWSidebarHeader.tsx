import 'components/component_kit/CWSidebarHeader/CWSidebarHeader.scss';
import React from 'react';

import { navigateToCommunity, useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import { featureFlags } from '../../../../helpers/feature-flags';
import { Skeleton } from '../../Skeleton';
import { CWCommunityAvatar } from '../../component_kit/cw_community_avatar';
import { CWText } from '../../component_kit/cw_text';
import { CWIconButton } from '../cw_icon_button';

const SidebarHeader = ({ handleToggle }: { handleToggle: () => void }) => {
  const navigate = useCommonNavigate();

  return (
    <div className="SidebarHeader">
      <CWCommunityAvatar
        showSkeleton={!app?.chain?.meta}
        community={app?.chain?.meta}
        onClick={() =>
          navigateToCommunity({ navigate, path: '', chain: app.chain.id })
        }
      />

      <CWText className="header" type="h5">
        {app?.chain?.meta?.name || <Skeleton width="70%" />}
      </CWText>

      {featureFlags.sidebarToggle && app.activeChainId() && (
        <div className="collapsable-icon">
          <CWIconButton
            iconButtonTheme="black"
            iconName="caretDoubleLeft"
            onClick={handleToggle}
          />
        </div>
      )}
    </div>
  );
};

export default SidebarHeader;

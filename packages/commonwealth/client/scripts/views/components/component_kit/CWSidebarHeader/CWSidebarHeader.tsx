import 'components/component_kit/CWSidebarHeader/CWSidebarHeader.scss';
import React from 'react';

import { navigateToCommunity, useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import CollapsableSidebarButton from 'views/components/sidebar/CollapsableSidebarButton';
import { Skeleton } from '../../Skeleton';
import { CWCommunityAvatar } from '../../component_kit/cw_community_avatar';
import { CWText } from '../../component_kit/cw_text';

const SidebarHeader = ({
  isInsideCommunity,
  onMobile,
}: {
  isInsideCommunity: boolean;
  onMobile: boolean;
}) => {
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

      {isInsideCommunity && (
        <CollapsableSidebarButton
          isInsideCommunity={isInsideCommunity}
          onMobile={onMobile}
        />
      )}
    </div>
  );
};

export default SidebarHeader;

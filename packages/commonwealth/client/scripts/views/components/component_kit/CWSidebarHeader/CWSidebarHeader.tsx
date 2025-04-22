import React from 'react';
import './CWSidebarHeader.scss';

import { navigateToCommunity, useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import CollapsableSidebarButton from 'views/components/sidebar/CollapsableSidebarButton';
import { handleMouseEnter, handleMouseLeave } from 'views/menus/utils';
import { smartTrim } from '../../../../../../shared/utils';
import { Skeleton } from '../../Skeleton';
import { CWCommunityAvatar } from '../../component_kit/cw_community_avatar';
import { CWText } from '../../component_kit/cw_text';
import { CWTooltip } from '../../component_kit/new_designs/CWTooltip';
import { CWIcon } from '../cw_icons/cw_icon';

const tierIcons = {
  1: 'globe',
  2: 'pins',
  3: 'whiteCheck',
  4: 'starGolden',
} as const;

const SidebarHeader = ({
  isInsideCommunity,
  onMobile,
}: {
  isInsideCommunity: boolean;
  onMobile: boolean;
}) => {
  const navigate = useCommonNavigate();

  const communityId = app.activeChainId() || '';
  const { data: community } = useGetCommunityByIdQuery({
    id: communityId,
    enabled: !!communityId,
  });

  return (
    <div className="SidebarHeader">
      {isInsideCommunity && (
        <>
          <CWCommunityAvatar
            showSkeleton={!app?.chain?.meta}
            community={{
              iconUrl: community?.icon_url || '',
              name: community?.name || '',
            }}
            onClick={() =>
              app.chain.id &&
              navigateToCommunity({ navigate, path: '', chain: app.chain.id })
            }
          />
          <CWTooltip
            content={
              community?.name && community.name.length > 17
                ? community.name
                : null
            }
            placement="top"
            renderTrigger={(handleInteraction, isTooltipOpen) => (
              <div className="header-container">
                <CWText
                  className="header"
                  type="h5"
                  onClick={() =>
                    app.chain.id &&
                    navigateToCommunity({
                      navigate,
                      path: '',
                      chain: app.chain.id,
                    })
                  }
                  onMouseEnter={(e) => {
                    handleMouseEnter({ e, isTooltipOpen, handleInteraction });
                  }}
                  onMouseLeave={(e) => {
                    handleMouseLeave({ e, isTooltipOpen, handleInteraction });
                  }}
                >
                  {smartTrim(community?.name, 17) || <Skeleton width="70%" />}
                </CWText>
                {community?.tier && tierIcons[community.tier] && (
                  <CWIcon
                    iconName={tierIcons[community.tier]}
                    iconSize="small"
                  />
                )}
              </div>
            )}
          />
        </>
      )}
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

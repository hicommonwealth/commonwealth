import clsx from 'clsx';
import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { CWCard } from '../../../../components/component_kit/cw_card';
import { CWCommunityAvatar } from '../../../../components/component_kit/cw_community_avatar';
import { CWText } from '../../../../components/component_kit/cw_text';
import './CommunityPreviewCard.scss';

type CommunityPreviewCardProps = {
  community?: { name: string; icon_url: string };
  monthlyThreadCount?: number;
  isCommunityMember?: boolean;
  hasNewContent?: boolean;
  onClick?: () => any;
  isExploreMode?: boolean;
};

const CommunityPreviewCard = ({
  community,
  monthlyThreadCount,
  isCommunityMember,
  hasNewContent,
  onClick,
  isExploreMode,
}: CommunityPreviewCardProps) => {
  return (
    <CWCard
      className={clsx('CommunityPreviewCard', { isExploreMode })}
      elevation="elevation-1"
      interactive
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
      }}
    >
      {isExploreMode ? (
        <CWText type="h4" className="explore-label">
          Explore communities <CWIcon iconName="arrowRightPhosphor" />
        </CWText>
      ) : (
        <>
          <CWCommunityAvatar
            community={{
              name: community?.name || '',
              iconUrl: community?.icon_url || '',
            }}
            size="large"
          />
          {community?.name && (
            <CWText type="h4" fontWeight="medium">
              {community?.name}
            </CWText>
          )}
          <div className="thread-counts">
            <CWIcon iconName="notepad" weight="light" />
            <CWText className="card-subtext" type="b2" fontWeight="medium">
              {`${monthlyThreadCount || 0}`}
            </CWText>
            {isCommunityMember && hasNewContent && (
              <CWTag type="new" label="New" />
            )}
          </div>
        </>
      )}
    </CWCard>
  );
};

export { CommunityPreviewCard };

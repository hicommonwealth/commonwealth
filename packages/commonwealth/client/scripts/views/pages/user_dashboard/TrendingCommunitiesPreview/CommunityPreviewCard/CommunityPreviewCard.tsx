import clsx from 'clsx';
import { pluralize } from 'helpers';
import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import CommunityInfo from '../../../../../models/ChainInfo';
import { CWCard } from '../../../../components/component_kit/cw_card';
import { CWCommunityAvatar } from '../../../../components/component_kit/cw_community_avatar';
import { CWText } from '../../../../components/component_kit/cw_text';
import './CommunityPreviewCard.scss';

type CommunityPreviewCardProps = {
  community?: CommunityInfo;
  monthlyThreadCount?: number;
  isCommunityMember?: boolean;
  hasUnseenPosts?: boolean;
  onClick?: () => any;
  isExploreMode?: boolean;
};

const CommunityPreviewCard = ({
  community = {} as CommunityInfo,
  monthlyThreadCount,
  isCommunityMember,
  hasUnseenPosts,
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
          <CWCommunityAvatar community={community} size="large" />
          {community.name && (
            <CWText type="h4" fontWeight="medium">
              {community.name}
            </CWText>
          )}
          {monthlyThreadCount > 0 && (
            <div className="thread-counts">
              <CWIcon iconName="notepad" weight="light" />
              <CWText className="card-subtext" type="b2" fontWeight="medium">
                {`${pluralize(
                  monthlyThreadCount,
                  'new thread',
                )} created this month`}
              </CWText>
              {isCommunityMember && hasUnseenPosts && (
                <CWText className="new-activity-tag">New</CWText>
              )}
            </div>
          )}
        </>
      )}
    </CWCard>
  );
};

export { CommunityPreviewCard };

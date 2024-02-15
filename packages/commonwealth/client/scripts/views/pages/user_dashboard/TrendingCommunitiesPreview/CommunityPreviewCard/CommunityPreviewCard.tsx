import { pluralize } from 'helpers';
import React from 'react';
import CommunityInfo from '../../../../../models/ChainInfo';
import { CWCard } from '../../../../components/component_kit/cw_card';
import { CWCommunityAvatar } from '../../../../components/component_kit/cw_community_avatar';
import { CWText } from '../../../../components/component_kit/cw_text';
import './CommunityPreviewCard.scss';

type CommunityPreviewCardProps = {
  community: CommunityInfo;
  monthlyThreadCount?: number;
  isCommunityMember?: boolean;
  hasUnseenPosts?: boolean;
  onClick?: () => any;
};

const CommunityPreviewCard = ({
  community,
  monthlyThreadCount,
  isCommunityMember,
  hasUnseenPosts,
  onClick,
}: CommunityPreviewCardProps) => {
  return (
    <CWCard
      className="CommunityPreviewCard"
      elevation="elevation-1"
      interactive
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
      }}
    >
      <div className="card-top">
        <CWCommunityAvatar community={community} />
        <CWText type="h4" fontWeight="medium">
          {community.name}
        </CWText>
      </div>
      <CWText className="card-subtext" type="b2">
        {community.description}
      </CWText>
      {monthlyThreadCount > 0 && (
        <>
          <CWText className="card-subtext" type="b2" fontWeight="medium">
            {`${pluralize(monthlyThreadCount, 'new thread')} this month`}
          </CWText>
          {isCommunityMember && hasUnseenPosts && (
            <CWText className="new-activity-tag">New</CWText>
          )}
        </>
      )}
    </CWCard>
  );
};

export { CommunityPreviewCard };

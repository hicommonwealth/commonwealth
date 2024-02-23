import type { IEventLabel } from 'chain/labelers/util';
import 'pages/user_dashboard/user_dashboard_chain_event_row.scss';
import React from 'react';
import { Link } from 'react-router-dom';
import CommunityInfo from '../../../models/ChainInfo';
import { Skeleton } from '../../components/Skeleton';
import { CWCommunityAvatar } from '../../components/component_kit/cw_community_avatar';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import type { IconName } from '../../components/component_kit/cw_icons/cw_icon_lookup';
import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';

type UserDashboardChainEventRowProps = {
  blockNumber?: number;
  community: CommunityInfo;
  label: IEventLabel;
  showSkeleton?: boolean;
};

export const UserDashboardChainEventRowSkeleton = () => {
  return (
    <div className="UserDashboardChainEventRow">
      <div className="chain-event-icon-container">
        <Skeleton height={20} width={20} />
      </div>
      <div className="chain-event-text-container w-full">
        <div className="community-title">
          <CWCommunityAvatar community={{} as any} showSkeleton />
          <div className="ml-8">
            <CWText type="caption" fontWeight="medium">
              <Skeleton width={50} />
            </CWText>
          </div>
          <div className="dot">.</div>
          <CWText type="caption" fontWeight="medium" className="block">
            <Skeleton width={50} />
          </CWText>
        </div>

        <CWText className="row-top-text">
          <Skeleton width={200} />
        </CWText>
        <div>
          <Skeleton width={'90%'} />
        </div>
      </div>
    </div>
  );
};

export const UserDashboardChainEventRow = ({
  blockNumber,
  community,
  label,
  showSkeleton,
}: UserDashboardChainEventRowProps) => {
  if (showSkeleton) {
    return <UserDashboardChainEventRowSkeleton />;
  }

  return (
    <Link
      className={getClasses<{ isLink?: boolean }>(
        { isLink: !!label.linkUrl },
        'UserDashboardChainEventRow',
      )}
      {...(label.linkUrl && { to: label.linkUrl })}
    >
      <div className="chain-event-icon-container">
        <CWIcon
          iconName={label.icon ? (label.icon as IconName) : 'element'}
          className={label.icon === 'delegate' ? 'delegate' : ''}
        />
      </div>
      <div className="chain-event-text-container">
        <div className="community-title">
          <CWCommunityAvatar community={community} size="small" />
          <Link
            onClick={(e) => {
              e.stopPropagation();
            }}
            {...(community?.id && { to: `/${community?.id}` })}
          >
            <CWText type="caption" fontWeight="medium">
              {community?.name || 'Unknown chain'}
            </CWText>
          </Link>
          <div className="dot">.</div>
          {blockNumber ? (
            <CWText type="caption" fontWeight="medium" className="block">
              Block {blockNumber}
            </CWText>
          ) : null}
        </div>
        <CWText className="row-top-text" fontWeight="bold">
          {label.heading}
        </CWText>
        <CWText type="caption" className="label">
          {label.label}
        </CWText>
      </div>
    </Link>
  );
};

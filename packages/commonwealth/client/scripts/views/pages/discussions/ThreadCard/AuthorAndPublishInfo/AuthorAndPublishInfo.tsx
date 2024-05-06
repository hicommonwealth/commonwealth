import { PopperPlacementType } from '@mui/base/Popper';
import { threadStageToLabel } from 'helpers';
import { getRelativeTimestamp } from 'helpers/dates';
import moment from 'moment';
import React, { useRef } from 'react';
import { ArchiveTrayWithTooltip } from 'views/components/ArchiveTrayWithTooltip';
import { LockWithTooltip } from 'views/components/LockWithTooltip';
import { CWText } from 'views/components/component_kit/cw_text';
import { getClasses } from 'views/components/component_kit/helpers';
import CWPopover, {
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { UserProfile } from '../../../../../models/MinimumProfile';
import { IThreadCollaborator } from '../../../../../models/Thread';
import { ThreadStage } from '../../../../../models/types';
import { FullUser } from '../../../../components/user/fullUser';
import { NewThreadTag } from '../../NewThreadTag';
import './AuthorAndPublishInfo.scss';
import useAuthorMetadataCustomWrap from './useAuthorMetadataCustomWrap';

export type AuthorAndPublishInfoProps = {
  isHot?: boolean;
  authorAddress: string;
  authorCommunityId: string;
  discord_meta?: {
    user: { id: string; username: string };
    channel_id: string;
    message_id: string;
  };
  collaboratorsInfo?: IThreadCollaborator[];
  isLocked?: boolean;
  lockedAt?: string;
  lastUpdated?: string;
  publishDate?: moment.Moment;
  viewsCount?: number;
  showSplitDotIndicator?: boolean;
  showPublishLabelWithDate?: boolean;
  showEditedLabelWithDate?: boolean;
  showUserAddressWithInfo?: boolean;
  isSpamThread?: boolean;
  threadStage?: ThreadStage;
  onThreadStageLabelClick?: (threadStage: ThreadStage) => Promise<any>;
  archivedAt?: moment.Moment;
  popoverPlacement?: PopperPlacementType;
  profile?: UserProfile;
};

export const AuthorAndPublishInfo = ({
  isHot,
  authorAddress,
  authorCommunityId,
  isLocked,
  lockedAt,
  lastUpdated,
  viewsCount,
  publishDate,
  discord_meta,
  showSplitDotIndicator = true,
  showPublishLabelWithDate,
  showEditedLabelWithDate,
  isSpamThread,
  showUserAddressWithInfo = true,
  threadStage,
  onThreadStageLabelClick,
  collaboratorsInfo,
  archivedAt,
  popoverPlacement,
  profile,
}: AuthorAndPublishInfoProps) => {
  const popoverProps = usePopover();
  const containerRef = useRef(null);
  useAuthorMetadataCustomWrap(containerRef);

  const dotIndicator = showSplitDotIndicator && (
    <CWText className="dot-indicator">•</CWText>
  );

  const fromDiscordBot = discord_meta !== null && discord_meta !== undefined;

  return (
    <div className="AuthorAndPublishInfo" ref={containerRef}>
      <FullUser
        avatarSize={24}
        userAddress={authorAddress}
        userCommunityId={authorCommunityId}
        shouldShowPopover
        shouldLinkProfile
        shouldShowAsDeleted={!authorAddress && !authorCommunityId}
        shouldShowAddressWithDisplayName={
          fromDiscordBot ? false : showUserAddressWithInfo
        }
        popoverPlacement={popoverPlacement}
        profile={profile}
      />

      {fromDiscordBot && (
        <>
          {dotIndicator}
          <CWText type="caption" className="discord-author">
            <b>{discord_meta?.user?.username}</b>
          </CWText>
          {dotIndicator}
          <CWTag label="Discord" type="login" iconName="discord" />
          {dotIndicator}
          <CWText type="caption" className="discord-author">
            Bridged from Discord
          </CWText>
        </>
      )}

      {collaboratorsInfo?.length > 0 && (
        <>
          <CWText type="caption">and</CWText>
          <CWText
            type="caption"
            className="section-text cursor-pointer"
            onMouseEnter={popoverProps.handleInteraction}
            onMouseLeave={popoverProps.handleInteraction}
          >
            {`${collaboratorsInfo.length} other${
              collaboratorsInfo.length > 1 ? 's' : ''
            }`}
            <CWPopover
              content={
                <div className="collaborators">
                  {collaboratorsInfo.map(({ address, community_id, User }) => {
                    return (
                      <FullUser
                        shouldLinkProfile
                        key={address}
                        userAddress={address}
                        userCommunityId={community_id}
                        profile={User.Profiles[0]}
                      />
                    );
                  })}
                </div>
              }
              {...popoverProps}
            />
          </CWText>
        </>
      )}

      {publishDate && (
        <>
          {dotIndicator}

          <CWTooltip
            placement="top"
            content={
              <div style={{ display: 'flex', gap: '8px' }}>
                {publishDate.format('MMMM Do YYYY')} {dotIndicator}{' '}
                {publishDate.format('h:mm A')}
              </div>
            }
            renderTrigger={(handleInteraction) => (
              <CWText
                type="caption"
                fontWeight="regular"
                className="section-text publish-date"
                onMouseEnter={handleInteraction}
                onMouseLeave={handleInteraction}
              >
                {showPublishLabelWithDate ? 'Published ' : ''}
                {showEditedLabelWithDate ? 'Edited ' : ''}
                {getRelativeTimestamp(publishDate?.toISOString())}
              </CWText>
            )}
          />
        </>
      )}

      {viewsCount !== null && viewsCount >= 0 && (
        <>
          {dotIndicator}
          <CWText type="caption" className="section-text">
            {`${viewsCount} view${viewsCount > 1 ? 's' : ''}`}
          </CWText>
        </>
      )}

      {archivedAt && <ArchiveTrayWithTooltip archivedAt={moment(archivedAt)} />}

      {threadStage && (
        <>
          {dotIndicator}
          <CWText
            type="caption"
            className={getClasses<{ stage: 'negative' | 'positive' }>(
              {
                stage:
                  threadStage === ThreadStage.Failed ? 'negative' : 'positive',
              },
              'proposal-stage-text',
            )}
            onClick={async () => await onThreadStageLabelClick(threadStage)}
          >
            {threadStageToLabel(threadStage)}
          </CWText>
        </>
      )}

      <NewThreadTag threadCreatedAt={moment(publishDate)} />

      {isHot && <CWTag iconName="trendUp" label="Trending" type="trending" />}

      {isSpamThread && <CWTag label="SPAM" type="disabled" />}

      {isLocked && lockedAt && lastUpdated && (
        <LockWithTooltip
          lockedAt={moment(lockedAt)}
          updatedAt={moment(lastUpdated)}
        />
      )}
    </div>
  );
};

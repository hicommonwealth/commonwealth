import { PopperPlacementType } from '@mui/base/Popper';
import { threadStageToLabel } from 'helpers';
import moment from 'moment';
import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { ArchiveTrayWithTooltip } from 'views/components/ArchiveTrayWithTooltip';
import { LockWithTooltip } from 'views/components/LockWithTooltip';
import CommunityInfo from 'views/components/component_kit/CommunityInfo';
import { CWText } from 'views/components/component_kit/cw_text';
import { getClasses } from 'views/components/component_kit/helpers';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import CWPopover, {
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { CommentVersionHistory } from '../../../../../models/Comment';
import { UserProfile } from '../../../../../models/MinimumProfile';
import {
  IThreadCollaborator,
  ThreadVersionHistory,
} from '../../../../../models/Thread';
import { ThreadStage } from '../../../../../models/types';
import { CWSelectList } from '../../../../components/component_kit/new_designs/CWSelectList/index';
import { FullUser } from '../../../../components/user/fullUser';
import { NewThreadTag } from '../../NewThreadTag';
import './AuthorAndPublishInfo.scss';
import useAuthorMetadataCustomWrap from './useAuthorMetadataCustomWrap';
import { formatVersionText } from './utils';

export type AuthorAndPublishInfoProps = {
  isHot?: boolean;
  authorAddress: string;
  authorCommunityId: string;
  layoutType?: 'author-first' | 'community-first';
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
  versionHistory?: ThreadVersionHistory[] | CommentVersionHistory[];
  changeContentText?: (text: string) => void;
};

export const AuthorAndPublishInfo = ({
  isHot,
  authorAddress,
  authorCommunityId,
  layoutType = 'author-first',
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
  versionHistory,
  changeContentText,
}: AuthorAndPublishInfoProps) => {
  const popoverProps = usePopover();
  const containerRef = useRef(null);
  // @ts-expect-error <StrictNullChecks>
  useAuthorMetadataCustomWrap(containerRef);

  const dotIndicator = showSplitDotIndicator && (
    <CWText className="dot-indicator">•</CWText>
  );

  const collaboratorLookupInfo: Record<string, string> =
    collaboratorsInfo?.reduce((acc, collaborator) => {
      acc[collaborator.address] = collaborator.User.profile.name;
      return acc;
    }, {}) ?? {};

  const fromDiscordBot = discord_meta !== null && discord_meta !== undefined;
  const versionHistoryOptions = versionHistory?.map((v) => ({
    value: v.body || v.text,
    label: formatVersionText(
      moment(v.timestamp),
      v.address,
      collaboratorLookupInfo,
      profile?.name,
    ),
  }));

  const isCommunityFirstLayout = layoutType === 'community-first';
  const { data: communtyInfo, isLoading: isLoadingCommunity } =
    useGetCommunityByIdQuery({
      id: authorCommunityId,
      enabled: !!authorCommunityId,
    });

  return (
    <div className="AuthorAndPublishInfo" ref={containerRef}>
      {isCommunityFirstLayout && (
        <>
          {isLoadingCommunity ? (
            <CWCircleMultiplySpinner />
          ) : (
            <>
              <CommunityInfo
                name={communtyInfo?.name || ''}
                iconUrl={communtyInfo?.icon_url || ''}
                iconSize="regular"
                communityId={authorCommunityId}
              />
              {dotIndicator}
            </>
          )}
        </>
      )}
      <FullUser
        className={isCommunityFirstLayout ? 'community-user-info' : ''}
        avatarSize={24}
        userAddress={authorAddress}
        userCommunityId={authorCommunityId}
        shouldShowPopover
        shouldLinkProfile
        shouldHideAvatar={isCommunityFirstLayout}
        shouldShowAsDeleted={!authorAddress && !authorCommunityId}
        shouldShowAddressWithDisplayName={
          fromDiscordBot || isCommunityFirstLayout
            ? false
            : showUserAddressWithInfo
        }
        popoverPlacement={popoverPlacement}
        // @ts-expect-error <StrictNullChecks>
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

      {/*@ts-expect-error <StrictNullChecks>*/}
      {collaboratorsInfo?.length > 0 && (
        <>
          <CWText type="caption">and</CWText>
          <CWText
            type="caption"
            className="section-text cursor-pointer"
            onMouseEnter={popoverProps.handleInteraction}
            onMouseLeave={popoverProps.handleInteraction}
          >
            {/*@ts-expect-error <StrictNullChecks>*/}
            {`${collaboratorsInfo.length} other${
              // @ts-expect-error <StrictNullChecks>
              collaboratorsInfo.length > 1 ? 's' : ''
            }`}
            <CWPopover
              content={
                <div className="collaborators">
                  {/*@ts-expect-error <StrictNullChecks>*/}
                  {collaboratorsInfo.map(
                    ({
                      User,
                    }: {
                      address: string;
                      community_id: string;
                      User: { id: number; profile: UserProfile };
                    }) => {
                      return (
                        <Link key={User.id} to={`/profile/id/${User.id}`}>
                          <CWText className="collaborator-user-name">
                            {User.profile.name}
                          </CWText>
                        </Link>
                      );
                    },
                  )}
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
          {/*@ts-expect-error <StrictNullChecks>*/}
          {versionHistoryOptions?.length > 1 ? (
            <div className="version-history">
              <CWSelectList
                options={versionHistoryOptions}
                placeholder={`Edited ${moment(versionHistory?.[0]?.timestamp)
                  ?.utc?.()
                  ?.local?.()
                  ?.format('DD/MM/YYYY')}`}
                // @ts-expect-error <StrictNullChecks>
                onChange={({ value }) => {
                  // @ts-expect-error <StrictNullChecks>
                  changeContentText(value);
                }}
                formatOptionLabel={(option) => {
                  return option.label.split('\n')[0];
                }}
                isSearchable={false}
              />
            </div>
          ) : (
            <CWTooltip
              placement="top"
              content={
                <div style={{ display: 'flex', gap: '8px' }}>
                  {publishDate?.utc?.()?.local?.()?.format('Do MMMM, YYYY')}{' '}
                  {dotIndicator}{' '}
                  {publishDate?.utc?.()?.local?.()?.format('h:mm A')}
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
                  {publishDate?.utc?.()?.local?.()?.format('DD/MM/YYYY')}
                </CWText>
              )}
            />
          )}
        </>
      )}

      {/*@ts-expect-error <StrictNullChecks>*/}
      {viewsCount !== null && viewsCount >= 0 && (
        <>
          {dotIndicator}
          <CWText type="caption" className="section-text">
            {/*@ts-expect-error <StrictNullChecks>*/}
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
            // @ts-expect-error <StrictNullChecks>
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

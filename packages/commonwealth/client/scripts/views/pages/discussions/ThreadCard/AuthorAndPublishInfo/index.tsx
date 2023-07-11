import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { threadStageToLabel } from '../../../../../helpers/index';
import type Account from '../../../../../models/Account';
import AddressInfo from '../../../../../models/AddressInfo';
import MinimumProfile from '../../../../../models/MinimumProfile';
import { IThreadCollaborator } from '../../../../../models/Thread';
import { ThreadStage } from '../../../../../models/types';
import {
  Popover,
  usePopover,
} from '../../../../components/component_kit/cw_popover/cw_popover';
import { CWTag } from '../../../../components/component_kit/cw_tag';
import { CWText } from '../../../../components/component_kit/cw_text';
import { getClasses } from '../../../../components/component_kit/helpers';
import { User } from '../../../../components/user/user';
import './index.scss';
import { LockWithTooltip } from '../../../../components/lock_with_tooltip';
import moment from 'moment';

export type AuthorAndPublishInfoProps = {
  isNew?: boolean;
  authorInfo: Account | AddressInfo | MinimumProfile | undefined;
  discord_meta?: {
    user: { id: string; username: string };
    channel_id: string;
    message_id: string;
  };
  collaboratorsInfo?: IThreadCollaborator[];
  isLocked?: boolean;
  lockedAt?: string;
  lastUpdated?: string;
  publishDate?: string;
  viewsCount?: number;
  showSplitDotIndicator?: boolean;
  showPublishLabelWithDate?: boolean;
  showEditedLabelWithDate?: boolean;
  showUserAddressWithInfo?: boolean;
  isSpamThread?: boolean;
  threadStage?: ThreadStage;
  onThreadStageLabelClick?: (threadStage: ThreadStage) => Promise<any>;
};

export const AuthorAndPublishInfo = ({
  isNew,
  authorInfo,
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
}: AuthorAndPublishInfoProps) => {
  const popoverProps = usePopover();

  const dotIndicator = showSplitDotIndicator && (
    <CWText className="dot-indicator">•</CWText>
  );

  const fromDiscordBot = discord_meta !== null && discord_meta !== undefined;

  return (
    <div className="AuthorAndPublishInfo">
      <User
        avatarSize={24}
        user={authorInfo}
        popover
        linkify
        showAddressWithDisplayName={
          fromDiscordBot ? false : showUserAddressWithInfo
        }
      />

      {fromDiscordBot && (
        <>
          {dotIndicator}
          <CWText type="caption" className="discord-author">
            author:
            <b>{discord_meta?.user?.username}</b>
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
            <Popover
              content={
                <div className="collaborators">
                  {collaboratorsInfo.map(({ address, chain }) => {
                    return (
                      <User
                        linkify
                        key={address}
                        user={new AddressInfo(null, address, chain, null)}
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
          <CWText type="caption" fontWeight="medium" className="section-text">
            {showPublishLabelWithDate ? 'Published on ' : ''}
            {showEditedLabelWithDate ? 'Edited on ' : ''}
            {publishDate}
          </CWText>
        </>
      )}

      {viewsCount >= 0 && (
        <>
          {dotIndicator}
          <CWText type="caption" className="section-text">
            {`${viewsCount} view${viewsCount > 1 ? 's' : ''}`}
          </CWText>
        </>
      )}

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
              'proposal-stage-text'
            )}
            onClick={async () => await onThreadStageLabelClick(threadStage)}
          >
            {threadStageToLabel(threadStage)}
          </CWText>
        </>
      )}

      {isNew && (
        <>
          {dotIndicator}
          <CWTag label={'NEW'} type={'new'} iconName={'newStar'} />
        </>
      )}

      {fromDiscordBot && (
        <>
          {dotIndicator}
          <CWTag label={'DISCORD'} type={'discord'} />
        </>
      )}

      {isSpamThread && (
        <>
          {dotIndicator}
          <CWTag label={'SPAM'} type={'disabled'} />
        </>
      )}

      {isLocked && lockedAt && lastUpdated && (
        <>
          {dotIndicator}
          <LockWithTooltip
            lockedAt={moment(lockedAt)}
            updatedAt={moment(lastUpdated)}
          />
        </>
      )}
    </div>
  );
};

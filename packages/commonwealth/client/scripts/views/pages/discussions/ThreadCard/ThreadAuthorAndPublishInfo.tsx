import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { threadStageToLabel } from '../../../../helpers/index';
import type Account from '../../../../models/Account';
import AddressInfo from '../../../../models/AddressInfo';
import MinimumProfile from '../../../../models/MinimumProfile';
import { IThreadCollaborator } from '../../../../models/Thread';
import { ThreadStage } from '../../../../models/types';
import {
  Popover,
  usePopover,
} from '../../../components/component_kit/cw_popover/cw_popover';
import { CWTag } from '../../../components/component_kit/cw_tag';
import { CWText } from '../../../components/component_kit/cw_text';
import { getClasses } from '../../../components/component_kit/helpers';
import { User } from '../../../components/user/user';
import './ThreadAuthorAndPublishInfo.scss';

export type ThreadAuthorAndPublishInfoProps = {
  isNewThread?: boolean;
  authorInfo: Account | AddressInfo | MinimumProfile | undefined;
  collaboratorsInfo?: IThreadCollaborator[];
  isThreadLocked?: boolean;
  threadPublishDate?: string;
  viewsCount?: number;
  showSplitDotIndicator: boolean;
  showPublishLabelWithDate?: boolean;
  showEditedLabelWithDate?: boolean;
  showUserAddressWithInfo?: boolean;
  isSpamThread?: boolean;
  threadStage?: ThreadStage;
  onThreadStageLabelClick?: (threadStage: ThreadStage) => Promise<any>;
};

export const ThreadAuthorAndPublishInfo = ({
  isNewThread,
  authorInfo,
  isThreadLocked,
  viewsCount,
  threadPublishDate,
  showSplitDotIndicator,
  showPublishLabelWithDate,
  showEditedLabelWithDate,
  isSpamThread,
  showUserAddressWithInfo = true,
  threadStage,
  onThreadStageLabelClick,
  collaboratorsInfo,
}: ThreadAuthorAndPublishInfoProps) => {
  const popoverProps = usePopover();

  const dotIndicator = showSplitDotIndicator && (
    <CWText className="last-updated-text">•</CWText>
  );

  return (
    <div className="ThreadAuthorAndPublishInfo">
      <User
        avatarSize={24}
        user={authorInfo}
        linkify
        showAddressWithDisplayName={showUserAddressWithInfo}
      />

      {collaboratorsInfo?.length > 0 && (
        <>
          <CWText type="caption">and</CWText>
          <CWText
            type="caption"
            className="trigger-text"
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

      {threadPublishDate && (
        <>
          {dotIndicator}
          <CWText
            type="caption"
            fontWeight="medium"
            className="last-updated-text"
          >
            {showPublishLabelWithDate ? 'Published on ' : ''}
            {showEditedLabelWithDate ? 'Edited on ' : ''}
            {threadPublishDate}
          </CWText>
        </>
      )}

      {viewsCount >= 0 && (
        <>
          {dotIndicator}
          <CWText type="caption" className="header-text">
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

      {isNewThread && (
        <>
          {dotIndicator}
          <CWTag label={'NEW'} type={'new'} iconName={'newStar'} />
        </>
      )}

      {isSpamThread && (
        <>
          {dotIndicator}
          <CWTag label={'SPAM'} type={'disabled'} />
        </>
      )}

      {isThreadLocked && (
        <>
          {dotIndicator}
          <CWIcon iconName="lock" iconSize="small" />
        </>
      )}
    </div>
  );
};

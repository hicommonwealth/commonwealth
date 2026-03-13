import {
  GatedActionEnum,
  MIN_CHARS_TO_SHOW_MORE,
} from '@hicommonwealth/shared';
import JoinCommunityBanner from 'client/scripts/views/components/JoinCommunityBanner';
import MarkdownViewerWithFallback from 'client/scripts/views/components/MarkdownViewerWithFallback';
import { CWGatedTopicBanner } from 'client/scripts/views/components/component_kit/CWGatedTopicBanner';
import { CWIcon } from 'client/scripts/views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import moment from 'moment';
import React, { type ReactNode } from 'react';
import { EditBody } from './edit_body';
import { LockMessage } from './lock_message';
import type { UseViewThreadDataResult } from './useViewThreadData';
import { shouldShowViewThreadGatedTopicBanner } from './viewThreadPage.contracts';

type ViewThreadPageBodyProps = {
  data: UseViewThreadDataResult;
  threadOptionsComp: ReactNode;
};

export const ViewThreadPageBody = ({
  data,
  threadOptionsComp,
}: ViewThreadPageBodyProps) => {
  if (data.thread && data.isEditingBody && data.threadBody) {
    return (
      <div className="thread-content">
        <EditBody
          title={data.draftTitle}
          thread={data.thread}
          activeThreadBody={data.threadBody}
          savedEdits={data.savedEdits}
          shouldRestoreEdits={data.shouldRestoreEdits}
          cancelEditing={() => {
            data.setIsGloballyEditing(false);
            data.setIsEditingBody(false);
            if (!data.draftTitle.length) {
              data.handleDraftTitleChange(data.thread?.title);
            }
          }}
          threadUpdatedCallback={() => {
            data.setIsGloballyEditing(false);
            data.setIsEditingBody(false);
          }}
          isDisabled={!data.draftTitle || !data.draftTitle.length}
        />
        {threadOptionsComp}
      </div>
    );
  }

  return (
    <div className="thread-content">
      <MarkdownViewerWithFallback
        key={data.threadBody}
        markdown={data.threadBody || ''}
        cutoffLines={50}
        maxChars={MIN_CHARS_TO_SHOW_MORE}
      />

      {data.thread?.readOnly || data.fromDiscordBot ? (
        <>
          {threadOptionsComp}
          {!data.thread?.readOnly && data.thread?.markedAsSpamAt && (
            <div className="callout-text">
              <CWIcon iconName="flag" weight="fill" iconSize="small" />
              <CWText type="h5">
                This thread was flagged as spam on{' '}
                {moment(data.thread.createdAt).format('DD/MM/YYYY')}, meaning it
                can no longer be edited or commented on.
              </CWText>
            </div>
          )}
          {data.showLocked && (
            <LockMessage
              lockedAt={data.thread?.lockedAt}
              updatedAt={data.thread?.updatedAt}
              fromDiscordBot={data.fromDiscordBot}
            />
          )}
        </>
      ) : data.thread && !data.isGloballyEditing && data.user.isLoggedIn ? (
        <>
          {threadOptionsComp}
          {shouldShowViewThreadGatedTopicBanner({
            hideGatingBanner: data.hideGatingBanner,
            isThreadAuthor: data.isAuthor,
            isTopicGated: data.isTopicGated,
          }) && (
            <CWGatedTopicBanner
              actions={[
                GatedActionEnum.CREATE_COMMENT,
                GatedActionEnum.CREATE_COMMENT_REACTION,
                GatedActionEnum.CREATE_THREAD_REACTION,
                GatedActionEnum.UPDATE_POLL,
              ]}
              actionGroups={data.actionGroups}
              bypassGating={data.bypassGating}
              onClose={() => data.setHideGatingBanner(true)}
            />
          )}
          {data.showBanner && (
            <JoinCommunityBanner
              onClose={data.handleCloseBanner}
              onJoin={data.handleJoinCommunity}
            />
          )}
        </>
      ) : null}
    </div>
  );
};

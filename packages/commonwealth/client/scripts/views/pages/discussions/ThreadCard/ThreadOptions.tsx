import Thread from 'models/Thread';
import React, { useState } from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../../components/component_kit/cw_text';
import { ThreadReactionPreviewButtonSmall } from '../../../components/ReactionButton/ThreadPreviewReactionButtonSmall';
import { SharePopover } from '../../../components/share_popover';
import {
  getCommentSubscription,
  getReactionSubscription,
  handleToggleSubscription,
} from '../helpers';
import {
  ThreadAdminActions,
  ThreadAdminActionsProps,
} from './ThreadAdminActions';
import './ThreadOptions.scss';

type ThreadOptionsProps = ThreadAdminActionsProps & {
  thread?: Thread;
  canVote?: boolean;
  shareEndpoint?: string;
  canUpdateThread?: boolean;
  totalComments?: number;
};

export const ThreadOptions = ({
  thread,
  canVote = false,
  shareEndpoint,
  canUpdateThread,
  totalComments,
  onLockToggle,
  onChangeTopic,
  onCollaboratorsEdit,
  onDelete,
  onEditCancel,
  onEditConfirm,
  onPinToggle,
  onProposalStageChange,
  onSnapshotProposalFromThread,
  onSpamToggle,
  hasPendingEdits,
}: ThreadOptionsProps) => {
  const [isSubscribed, setIsSubscribed] = useState(
    thread &&
      getCommentSubscription(thread)?.isActive &&
      getReactionSubscription(thread)?.isActive
  );

  return (
    <>
      <div className="ThreadOptions">
        {canVote && thread && (
          <ThreadReactionPreviewButtonSmall thread={thread} />
        )}

        {totalComments >= 0 && (
          <button className="thread-option-btn">
            <CWIcon color="black" iconName="comment" iconSize="small" />
            <CWText type="caption">
              {`${totalComments} comment${totalComments > 1 ? 's' : ''}`}
            </CWText>
          </button>
        )}

        <SharePopover
          // if share endpoint is present it will be used, else the current url will be used
          discussionLink={shareEndpoint}
          renderTrigger={(onClick) => (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onClick(e);
              }}
              className="thread-option-btn"
            >
              <CWIcon color="black" iconName="share" iconSize="small" />
              <CWText type="caption">Share</CWText>
            </button>
          )}
        />

        <button
          onClick={async (e) => {
            // prevent clicks from propagating to discussion row
            e.preventDefault();
            e.stopPropagation();
            thread &&
              (await handleToggleSubscription(
                thread,
                getCommentSubscription(thread),
                getReactionSubscription(thread),
                isSubscribed,
                setIsSubscribed
              ));
          }}
          className="thread-option-btn"
        >
          <CWIcon
            color="black"
            iconName={isSubscribed ? 'bellMuted' : 'bell'}
            iconSize="small"
          />
          <CWText type="caption">
            {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
          </CWText>
        </button>

        {canUpdateThread && thread && (
          <ThreadAdminActions
            thread={thread}
            onLockToggle={onLockToggle}
            onChangeTopic={onChangeTopic}
            onCollaboratorsEdit={onCollaboratorsEdit}
            onDelete={onDelete}
            onEditCancel={onEditCancel}
            onEditConfirm={onEditConfirm}
            onPinToggle={onPinToggle}
            onProposalStageChange={onProposalStageChange}
            onSnapshotProposalFromThread={onSnapshotProposalFromThread}
            onSpamToggle={onSpamToggle}
            hasPendingEdits={hasPendingEdits}
          />
        )}
      </div>
      {thread && <></>}
    </>
  );
};

import Thread from 'models/Thread';
import React, { useState } from 'react';
import { SharePopover } from 'views/components/share_popover';
import {
  getCommentSubscription,
  getReactionSubscription,
  handleToggleSubscription,
} from '../../helpers';
import { AdminActions, AdminActionsProps } from './AdminActions';
import { ReactionButton } from './ReactionButton';
import './ThreadOptions.scss';
import { CWThreadAction } from 'views/components/component_kit/new_designs/cw_thread_action';
import { pluralize } from 'helpers';

type OptionsProps = AdminActionsProps & {
  thread?: Thread;
  canVote?: boolean;
  canComment?: boolean;
  shareEndpoint?: string;
  canUpdateThread?: boolean;
  totalComments?: number;
};

export const ThreadOptions = ({
  thread,
  canVote = false,
  canComment = true,
  shareEndpoint,
  canUpdateThread,
  totalComments,
  onLockToggle,
  onTopicChange,
  onCollaboratorsEdit,
  onDelete,
  onEditStart,
  onEditCancel,
  onEditConfirm,
  onPinToggle,
  onProposalStageChange,
  onSnapshotProposalFromThread,
  onSpamToggle,
  hasPendingEdits,
}: OptionsProps) => {
  const [isSubscribed, setIsSubscribed] = useState(
    thread &&
      getCommentSubscription(thread)?.isActive &&
      getReactionSubscription(thread)?.isActive
  );

  const handleToggleSubscribe = async (e) => {
    // prevent clicks from propagating to discussion row
    e.preventDefault();
    e.stopPropagation();

    if (!thread) {
      return;
    }

    await handleToggleSubscription(
      thread,
      getCommentSubscription(thread),
      getReactionSubscription(thread),
      isSubscribed,
      setIsSubscribed
    );
  };

  return (
    <>
      <div
        className="ThreadOptions"
        onClick={(e) => {
          e.preventDefault();
        }}
      >
        {canVote && thread && <ReactionButton thread={thread} size="small" />}

        {canComment && totalComments >= 0 && (
          <CWThreadAction
            label={`${pluralize(totalComments, 'Comment')}`}
            action="comment"
          />
        )}

        <SharePopover
          // if share endpoint is present it will be used, else the current url will be used
          discussionLink={shareEndpoint}
        />

        <CWThreadAction
          action="subscribe"
          onClick={handleToggleSubscribe}
          selected={!isSubscribed}
          label={isSubscribed ? 'Unsubscribe' : 'Subscribe'}
        />

        {canUpdateThread && thread && (
          <AdminActions
            thread={thread}
            onLockToggle={onLockToggle}
            onTopicChange={onTopicChange}
            onCollaboratorsEdit={onCollaboratorsEdit}
            onDelete={onDelete}
            onEditStart={onEditStart}
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

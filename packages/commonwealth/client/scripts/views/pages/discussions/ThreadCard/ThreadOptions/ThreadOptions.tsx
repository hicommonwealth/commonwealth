import { ViewThreadUpvotesDrawer } from 'client/scripts/views/components/view_thread_upvotes_drawer';
import useUserActiveAccount from 'hooks/useUserActiveAccount';
import Thread from 'models/Thread';
import React, { useState } from 'react';
import { CWThreadAction } from 'views/components/component_kit/new_designs/cw_thread_action';
import { SharePopover } from 'views/components/share_popover';
import {
  getCommentSubscription,
  getReactionSubscription,
  handleToggleSubscription,
} from '../../helpers';
import { AdminActions, AdminActionsProps } from './AdminActions';
import { ReactionButton } from './ReactionButton';
import './ThreadOptions.scss';

type OptionsProps = AdminActionsProps & {
  thread?: Thread;
  upvoteBtnVisible?: boolean;
  commentBtnVisible?: boolean;
  shareEndpoint?: string;
  canUpdateThread?: boolean;
  canReact?: boolean;
  canComment?: boolean;
  totalComments?: number;
  disabledActionTooltipText?: string;
  onCommentBtnClick?: () => any;
  upvoteDrawerBtnBelow?: boolean;
};

export const ThreadOptions = ({
  thread,
  upvoteBtnVisible = false,
  commentBtnVisible = true,
  shareEndpoint,
  canUpdateThread,
  canReact = true,
  canComment = true,
  totalComments,
  onLockToggle,
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
  disabledActionTooltipText = '',
  onCommentBtnClick = () => null,
  upvoteDrawerBtnBelow,
}: OptionsProps) => {
  const [isSubscribed, setIsSubscribed] = useState(
    thread &&
      getCommentSubscription(thread)?.isActive &&
      getReactionSubscription(thread)?.isActive,
  );

  const { activeAccount: hasJoinedCommunity } = useUserActiveAccount();

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
      setIsSubscribed,
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
        <div className="options-container">
          {!upvoteDrawerBtnBelow && <ViewThreadUpvotesDrawer thread={thread} />}

          {upvoteBtnVisible && thread && (
            <ReactionButton
              thread={thread}
              size="small"
              disabled={!canReact}
              tooltipText={disabledActionTooltipText}
            />
          )}

          {commentBtnVisible && totalComments >= 0 && (
            <CWThreadAction
              label={`${totalComments}`}
              action="comment"
              disabled={!canComment}
              onClick={onCommentBtnClick}
              tooltipText={disabledActionTooltipText}
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
            disabled={!hasJoinedCommunity}
          />

          {canUpdateThread && thread && (
            <AdminActions
              thread={thread}
              onLockToggle={onLockToggle}
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
        {upvoteDrawerBtnBelow && <ViewThreadUpvotesDrawer thread={thread} />}
      </div>
      {thread && <></>}
    </>
  );
};

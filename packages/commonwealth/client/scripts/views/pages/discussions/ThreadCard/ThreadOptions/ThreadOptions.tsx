import { ViewUpvotesDrawerTrigger } from 'client/scripts/views/components/UpvoteDrawer';
import useUserActiveAccount from 'hooks/useUserActiveAccount';
import Thread from 'models/Thread';
import React, { Dispatch, SetStateAction, useState } from 'react';
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
  setIsUpvoteDrawerOpen?: Dispatch<SetStateAction<boolean>>;
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
  setIsUpvoteDrawerOpen,
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
      <div className="ThreadOptions">
        <div className="options-container">
          {!upvoteDrawerBtnBelow && (
            <ViewUpvotesDrawerTrigger
              onClick={(e) => {
                e.preventDefault();
                setIsUpvoteDrawerOpen(true);
              }}
            />
          )}

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
              onClick={(e) => {
                e.preventDefault();
                onCommentBtnClick();
              }}
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
        {upvoteDrawerBtnBelow && (
          <ViewUpvotesDrawerTrigger
            onClick={(e) => {
              e.preventDefault();
              setIsUpvoteDrawerOpen(true);
            }}
          />
        )}
      </div>
      {thread && <></>}
    </>
  );
};

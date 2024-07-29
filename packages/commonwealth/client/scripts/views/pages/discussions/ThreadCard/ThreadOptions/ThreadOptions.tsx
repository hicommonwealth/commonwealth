import { pluralize } from 'helpers';
import { GetThreadActionTooltipTextResponse } from 'helpers/threads';
import { useFlag } from 'hooks/useFlag';
import Thread from 'models/Thread';
import React, { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { useCreateThreadSubscriptionMutation } from 'state/api/trpc/subscription/useCreateThreadSubscriptionMutation';
import { useDeleteThreadSubscriptionMutation } from 'state/api/trpc/subscription/useDeleteThreadSubscriptionMutation';
import Permissions from 'utils/Permissions';
import { SharePopover } from 'views/components/SharePopover';
import { ViewUpvotesDrawerTrigger } from 'views/components/UpvoteDrawer';
import { CWThreadAction } from 'views/components/component_kit/new_designs/cw_thread_action';
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
  disabledActionsTooltipText?: GetThreadActionTooltipTextResponse;
  onCommentBtnClick?: () => any;
  upvoteDrawerBtnBelow?: boolean;
  hideUpvoteDrawerButton?: boolean;
  setIsUpvoteDrawerOpen?: Dispatch<SetStateAction<boolean>>;
  editingDisabled?: boolean;
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
  disabledActionsTooltipText = '',
  onCommentBtnClick = () => null,
  upvoteDrawerBtnBelow,
  hideUpvoteDrawerButton = false,
  setIsUpvoteDrawerOpen,
  editingDisabled,
}: OptionsProps) => {
  const [isSubscribed, setIsSubscribed] = useState(
    thread &&
      getCommentSubscription(thread)?.isActive &&
      getReactionSubscription(thread)?.isActive,
  );

  const isCommunityMember = Permissions.isCommunityMember(thread.communityId);

  const enableKnockInAppNotifications = useFlag('knockInAppNotifications');

  const doToggleSubscribeOld = useCallback(
    async (e: React.MouseEvent) => {
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
    },
    [isSubscribed, thread],
  );

  const createThreadSubscriptionMutation =
    useCreateThreadSubscriptionMutation();
  const deleteThreadSubscriptionMutation =
    useDeleteThreadSubscriptionMutation();

  const doToggleSubscribe = useCallback(
    async (e: React.MouseEvent) => {
      if (isSubscribed) {
        await deleteThreadSubscriptionMutation.mutateAsync({
          thread_id: thread.id,
        });
      } else {
        await createThreadSubscriptionMutation.mutateAsync({
          thread_ids: [thread.id],
        });
      }
    },
    [
      createThreadSubscriptionMutation,
      deleteThreadSubscriptionMutation,
      isSubscribed,
      thread.id,
    ],
  );

  const handleToggleSubscribe = useCallback(
    (e: React.MouseEvent) => {
      async function doAsync() {
        if (enableKnockInAppNotifications) {
          await doToggleSubscribe(e);
        } else {
          await doToggleSubscribeOld(e);
        }
      }

      // prevent clicks from propagating to discussion row
      e.preventDefault();
      e.stopPropagation();

      doAsync().catch(console.error);
    },
    [doToggleSubscribe, doToggleSubscribeOld, enableKnockInAppNotifications],
  );

  return (
    <>
      <div className="ThreadOptions">
        <div className="options-container">
          {!hideUpvoteDrawerButton && !upvoteDrawerBtnBelow && (
            <ViewUpvotesDrawerTrigger
              onClick={(e) => {
                e.preventDefault();
                // @ts-expect-error <StrictNullChecks/>
                setIsUpvoteDrawerOpen(true);
              }}
            />
          )}

          {upvoteBtnVisible && thread && (
            <ReactionButton
              thread={thread}
              size="small"
              disabled={!canReact}
              undoUpvoteDisabled={editingDisabled}
              tooltipText={
                typeof disabledActionsTooltipText === 'function'
                  ? disabledActionsTooltipText?.('upvote')
                  : disabledActionsTooltipText
              }
            />
          )}

          {/* @ts-expect-error StrictNullChecks*/}
          {commentBtnVisible && totalComments >= 0 && (
            <CWThreadAction
              // @ts-expect-error <StrictNullChecks/>
              label={pluralize(totalComments, 'Comment')}
              action="comment"
              disabled={!canComment}
              onClick={(e) => {
                e.preventDefault();
                onCommentBtnClick();
              }}
              tooltipText={
                typeof disabledActionsTooltipText === 'function'
                  ? disabledActionsTooltipText?.('comment')
                  : disabledActionsTooltipText
              }
            />
          )}

          {/* @ts-expect-error StrictNullChecks*/}
          <SharePopover linkToShare={shareEndpoint} buttonLabel="Share" />

          <CWThreadAction
            action="subscribe"
            label="Subscribe"
            onClick={handleToggleSubscribe}
            selected={!isSubscribed}
            disabled={!isCommunityMember}
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
              editingDisabled={editingDisabled}
            />
          )}
        </div>
        {!hideUpvoteDrawerButton && upvoteDrawerBtnBelow && (
          <ViewUpvotesDrawerTrigger
            onClick={(e) => {
              e.preventDefault();
              // @ts-expect-error <StrictNullChecks/>
              setIsUpvoteDrawerOpen(true);
            }}
          />
        )}
      </div>
      {thread && <></>}
    </>
  );
};

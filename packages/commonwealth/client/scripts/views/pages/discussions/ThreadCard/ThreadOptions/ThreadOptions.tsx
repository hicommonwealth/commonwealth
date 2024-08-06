import { pluralize } from 'helpers';
import { GetThreadActionTooltipTextResponse } from 'helpers/threads';
import { useFlag } from 'hooks/useFlag';
import Thread from 'models/Thread';
import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { useCreateThreadSubscriptionMutation } from 'state/api/trpc/subscription/useCreateThreadSubscriptionMutation';
import { useDeleteThreadSubscriptionMutation } from 'state/api/trpc/subscription/useDeleteThreadSubscriptionMutation';
import Permissions from 'utils/Permissions';
import { downloadDataAsFile } from 'utils/downloadDataAsFile';
import { SharePopover } from 'views/components/SharePopover';
import { ViewUpvotesDrawerTrigger } from 'views/components/UpvoteDrawer';
import { CWThreadAction } from 'views/components/component_kit/new_designs/cw_thread_action';
import { useThreadSubscriptions } from 'views/pages/NotificationSettings/useThreadSubscriptions';
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

  const doToggleSubscribeOld = useCallback(async () => {
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
  }, [isSubscribed, thread]);

  const handleDownloadMarkdown = () => {
    downloadDataAsFile(thread.plaintext, thread.title + '.md');
  };

  const createThreadSubscriptionMutation =
    useCreateThreadSubscriptionMutation();
  const deleteThreadSubscriptionMutation =
    useDeleteThreadSubscriptionMutation();

  const threadSubscriptions = useThreadSubscriptions();

  const hasThreadSubscriptionDefault = useMemo(() => {
    const matching = (threadSubscriptions.data || []).filter(
      (current) => current.thread_id === thread.id,
    );

    return matching.length > 0;
  }, [thread.id, threadSubscriptions.data]);

  const [hasThreadSubscriptionState, setHasThreadSubscriptionState] = useState<
    boolean | undefined
  >(undefined);

  const hasThreadSubscription =
    hasThreadSubscriptionState !== undefined
      ? hasThreadSubscriptionState
      : hasThreadSubscriptionDefault;

  const doToggleSubscribe = useCallback(async () => {
    if (hasThreadSubscription) {
      await deleteThreadSubscriptionMutation.mutateAsync({
        id: thread.id,
        thread_ids: [thread.id],
      });
    } else {
      await createThreadSubscriptionMutation.mutateAsync({
        id: thread.id,
        thread_id: thread.id,
      });
    }
    setHasThreadSubscriptionState(!hasThreadSubscription);
  }, [
    createThreadSubscriptionMutation,
    deleteThreadSubscriptionMutation,
    hasThreadSubscription,
    thread.id,
  ]);

  const handleToggleSubscribe = useCallback(
    (e: React.MouseEvent) => {
      async function doAsync() {
        if (enableKnockInAppNotifications) {
          await doToggleSubscribe();
        } else {
          await doToggleSubscribeOld();
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

          {!enableKnockInAppNotifications && (
            <CWThreadAction
              action="subscribe"
              label="Subscribe"
              onClick={handleToggleSubscribe}
              selected={!isSubscribed}
              disabled={!isCommunityMember}
            />
          )}

          {enableKnockInAppNotifications && (
            <CWThreadAction
              action="subscribe"
              label="Subscribe"
              onClick={handleToggleSubscribe}
              selected={!hasThreadSubscription}
              disabled={!isCommunityMember}
            />
          )}

          {thread && (
            <AdminActions
              canUpdateThread={canUpdateThread}
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
              onDownloadMarkdown={handleDownloadMarkdown}
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

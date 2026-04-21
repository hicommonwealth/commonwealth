import {
  ArrowBendUpRight,
  ArrowFatUp,
  BellSimple,
  BellSlash,
  ChatCenteredDots,
  DotsThree,
} from '@phosphor-icons/react';
import { buildCreateThreadReactionInput } from 'client/scripts/state/api/threads/createReaction';
import { buildDeleteThreadReactionInput } from 'client/scripts/state/api/threads/deleteReaction';
import { useAuthModalStore } from 'client/scripts/state/ui/modals';
import { SessionKeyError } from 'controllers/server/sessions';
import Thread from 'models/Thread';
import React, { useCallback, useMemo, useState } from 'react';
import app from 'state';
import {
  useCreateThreadReactionMutation,
  useDeleteThreadReactionMutation,
} from 'state/api/threads';
import { useCreateThreadSubscriptionMutation } from 'state/api/trpc/subscription/useCreateThreadSubscriptionMutation';
import { useDeleteThreadSubscriptionMutation } from 'state/api/trpc/subscription/useDeleteThreadSubscriptionMutation';
import useUserStore from 'state/ui/user';
import { ShareDialog } from 'views/components/ShareDialog/ShareDialog';
import { AuthModal } from 'views/modals/AuthModal';
import Permissions from '../../../../utils/Permissions';
import { CWText } from '../../../components/component_kit/cw_text';
import { CWTooltip } from '../../../components/component_kit/new_designs/CWTooltip';
import { useThreadSubscriptions } from '../../NotificationSettings/useThreadSubscriptions';
import {
  AdminActions,
  AdminActionsProps,
} from '../../discussions/ThreadCard/ThreadOptions/AdminActions';
import './PrimaryInteractions.scss';

type PrimaryInteractionsProps = {
  thread: Thread;
  upvotesCount?: number;
  commentsCount?: number;
  onCommentClick?: () => void;
  onOpenUpvotes?: () => void;
  shareEndpoint?: string;
} & Omit<AdminActionsProps, 'thread'>;

type ActionKey = 'upvotes' | 'comments' | 'share' | 'subscribe';

const actions: Array<{
  key: ActionKey;
  label: string;
  icon: typeof ArrowFatUp;
  countKey?: 'upvotes' | 'comments';
}> = [
  { key: 'upvotes', label: 'Upvotes', icon: ArrowFatUp, countKey: 'upvotes' },
  {
    key: 'comments',
    label: 'Comments',
    icon: ChatCenteredDots,
    countKey: 'comments',
  },
  { key: 'share', label: 'Share', icon: ArrowBendUpRight },
  { key: 'subscribe', label: 'Subscribe', icon: BellSimple },
];

const stopEvent = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
};

export const PrimaryInteractions = ({
  thread,
  upvotesCount = 0,
  commentsCount = 0,
  onCommentClick,
  onOpenUpvotes,
  shareEndpoint,
  canUpdateThread,
  onDelete,
  onSpamToggle,
  onLockToggle,
  onPinToggle,
  onProposalStageChange,
  onSnapshotProposalFromThread,
  onCollaboratorsEdit,
  onEditStart,
  onEditCancel,
  onEditConfirm,
  onDownloadMarkdown,
  hasPendingEdits,
  editingDisabled,
}: PrimaryInteractionsProps) => {
  const user = useUserStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();
  const communityId = app.activeChainId() || '';

  const thisUserReaction = thread?.associatedReactions?.filter(
    (r) => r.address === user.activeAccount?.address,
  );
  const hasReacted = thisUserReaction?.length !== 0;
  const reactedId = thisUserReaction?.length ? thisUserReaction[0].id : -1;

  const { mutateAsync: createThreadReaction } = useCreateThreadReactionMutation(
    {
      communityId,
      threadId: thread.id,
      threadMsgId: thread.canvasMsgId!,
      currentReactionCount: thread.reactionCount || 0,
      currentReactionWeightsSum: `${thread?.reactionWeightsSum || 0}`,
    },
  );
  const { mutateAsync: deleteThreadReaction } = useDeleteThreadReactionMutation(
    {
      communityId,
      address: user.activeAccount?.address || '',
      threadId: thread.id,
      threadMsgId: thread.canvasMsgId!,
      currentReactionCount: thread.reactionCount || 0,
      currentReactionWeightsSum: `${thread?.reactionWeightsSum || 0}`,
    },
  );

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

  const handleToggleSubscribe = useCallback(
    async (e: React.MouseEvent) => {
      stopEvent(e);
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
    },
    [
      createThreadSubscriptionMutation,
      deleteThreadSubscriptionMutation,
      hasThreadSubscription,
      thread.id,
    ],
  );

  const handleUpvoteToggle = useCallback(
    async (e: React.MouseEvent) => {
      stopEvent(e);

      if (!user.isLoggedIn || !user.activeAccount) {
        setIsAuthModalOpen(true);
        return;
      }

      if (hasReacted) {
        const input = await buildDeleteThreadReactionInput({
          communityId,
          address: user.activeAccount?.address,
          threadId: thread.id!,
          threadMsgId: thread.canvasMsgId!,
          reactionId: +reactedId,
        });
        deleteThreadReaction(input).catch((err) => {
          if (err instanceof SessionKeyError) {
            checkForSessionKeyRevalidationErrors(err);
            return;
          }
          console.error(err);
        });
        return;
      }

      const input = await buildCreateThreadReactionInput({
        communityId,
        address: user.activeAccount?.address || '',
        threadId: thread.id,
        threadMsgId: thread.canvasMsgId!,
        reactionType: 'like',
      });
      createThreadReaction(input).catch((err) => {
        if (err instanceof SessionKeyError) {
          checkForSessionKeyRevalidationErrors(err);
          return;
        }
        console.error(err);
      });
    },
    [
      checkForSessionKeyRevalidationErrors,
      communityId,
      createThreadReaction,
      deleteThreadReaction,
      hasReacted,
      reactedId,
      thread.canvasMsgId,
      thread.id,
      user.activeAccount,
      user.isLoggedIn,
    ],
  );

  const handleCountClick = (actionKey: ActionKey) => (e: React.MouseEvent) => {
    stopEvent(e);
    if (actionKey === 'upvotes') {
      onOpenUpvotes?.();
      return;
    }
    if (actionKey === 'comments') {
      onCommentClick?.();
    }
  };

  const handleIconClick = (actionKey: ActionKey) => (e: React.MouseEvent) => {
    if (actionKey === 'upvotes') {
      handleUpvoteToggle(e).catch(console.error);
      return;
    }
    if (actionKey === 'comments') {
      stopEvent(e);
      onCommentClick?.();
      return;
    }
    if (actionKey === 'share') {
      stopEvent(e);
      setIsShareDialogOpen(true);
      return;
    }
    if (actionKey === 'subscribe') {
      handleToggleSubscribe(e).catch(console.error);
    }
  };

  const isCommunityMember = Permissions.isCommunityMember(thread.communityId);

  return (
    <>
      <div className="PrimaryInteractions">
        {actions.map((action) => {
          const Icon =
            action.key === 'subscribe' && hasThreadSubscription
              ? BellSlash
              : action.icon;
          const count =
            action.countKey === 'upvotes'
              ? upvotesCount
              : action.countKey === 'comments'
                ? commentsCount
                : null;

          return (
            <CWTooltip
              key={action.key}
              placement="right"
              content={action.label}
              renderTrigger={(handleInteraction) => (
                <div
                  className={`PrimaryInteractions-item ${
                    count !== null
                      ? 'PrimaryInteractions-item--with-count'
                      : 'PrimaryInteractions-item--icon-only'
                  }`}
                  onMouseEnter={handleInteraction}
                  onMouseLeave={handleInteraction}
                >
                  <button
                    type="button"
                    className="ThreadAction PrimaryInteractions-target"
                    aria-label={`${action.label} icon`}
                    onClick={handleIconClick(action.key)}
                    disabled={
                      action.key === 'subscribe' ? !isCommunityMember : false
                    }
                  >
                    <Icon
                      size={18}
                      weight={
                        action.key === 'upvotes' && hasReacted
                          ? 'fill'
                          : 'regular'
                      }
                    />
                  </button>
                  {count !== null && (
                    <button
                      type="button"
                      className="ThreadAction PrimaryInteractions-target"
                      aria-label={`${action.label} count`}
                      onClick={handleCountClick(action.key)}
                    >
                      <CWText
                        type="caption"
                        className="PrimaryInteractions-count"
                      >
                        {count}
                      </CWText>
                    </button>
                  )}
                </div>
              )}
            />
          );
        })}

        <CWTooltip
          placement="right"
          content="More"
          renderTrigger={(handleInteraction) => (
            <div
              className="PrimaryInteractions-item PrimaryInteractions-item--icon-only"
              onMouseEnter={handleInteraction}
              onMouseLeave={handleInteraction}
            >
              <AdminActions
                thread={thread}
                canUpdateThread={canUpdateThread}
                onDelete={onDelete}
                onSpamToggle={onSpamToggle}
                onLockToggle={onLockToggle}
                onPinToggle={onPinToggle}
                onProposalStageChange={onProposalStageChange}
                onSnapshotProposalFromThread={onSnapshotProposalFromThread}
                onCollaboratorsEdit={onCollaboratorsEdit}
                onEditStart={onEditStart}
                onEditCancel={onEditCancel}
                onEditConfirm={onEditConfirm}
                onDownloadMarkdown={onDownloadMarkdown}
                hasPendingEdits={hasPendingEdits}
                editingDisabled={editingDisabled}
                renderTrigger={(onClick) => (
                  <button
                    type="button"
                    className="ThreadAction PrimaryInteractions-target"
                    aria-label="More actions"
                    onClick={(e) => {
                      stopEvent(e);
                      onClick(e);
                    }}
                  >
                    <DotsThree size={18} />
                  </button>
                )}
              />
            </div>
          )}
        />
      </div>

      <AuthModal
        onClose={() => setIsAuthModalOpen(false)}
        isOpen={isAuthModalOpen}
      />
      {shareEndpoint && (
        <ShareDialog
          open={isShareDialogOpen}
          onClose={() => setIsShareDialogOpen(false)}
          url={shareEndpoint}
          title={thread.title}
          text="See my thread and join me on Common"
          shareType="thread"
        />
      )}
    </>
  );
};

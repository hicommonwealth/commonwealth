import { buildCreateThreadReactionInput } from 'client/scripts/state/api/threads/createReaction';
import { buildDeleteThreadReactionInput } from 'client/scripts/state/api/threads/deleteReaction';
import { useAuthModalStore } from 'client/scripts/state/ui/modals';
import { notifyError } from 'controllers/app/notifications';
import { SessionKeyError } from 'controllers/server/sessions';
import type Thread from 'models/Thread';
import React, { useState } from 'react';
import { prettyVoteWeight } from 'shared/adapters/currency';
import app from 'state';
import {
  useCreateThreadReactionMutation,
  useDeleteThreadReactionMutation,
} from 'state/api/threads';
import useUserStore from 'state/ui/user';
import { getDisplayedReactorsForPopup } from 'views/components/ReactionButton/helpers';
import CWPopover, {
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';
import CWUpvoteSmall from 'views/components/component_kit/new_designs/CWUpvoteSmall';
import { TooltipWrapper } from 'views/components/component_kit/new_designs/cw_thread_action';
import { CWUpvote } from 'views/components/component_kit/new_designs/cw_upvote';
import { AuthModal } from 'views/modals/AuthModal';
import { ReactionButtonSkeleton } from './ReactionButtonSkeleton';

type ReactionButtonProps = {
  thread: Thread;
  size: 'small' | 'big';
  showSkeleton?: boolean;
  disabled: boolean;
  tooltipText?: string;
  undoUpvoteDisabled?: boolean;
};

export const ReactionButton = ({
  thread,
  size,
  disabled,
  showSkeleton,
  tooltipText,
  undoUpvoteDisabled,
}: ReactionButtonProps) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const reactors = thread?.associatedReactions?.map((t) => t.address!);

  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();
  const user = useUserStore();

  const reactionWeightsSum =
    BigInt(thread?.reactionCount || 0) > 0
      ? thread?.reactionWeightsSum
      : thread?.reactionCount?.toString() || '0';

  const activeAddress = user.activeAccount?.address;
  const thisUserReaction = thread?.associatedReactions?.filter(
    (r) => r.address === activeAddress,
  );
  const hasReacted = thisUserReaction?.length !== 0;
  const reactedId =
    thisUserReaction?.length === 0 ? -1 : thisUserReaction?.[0]?.id;
  const popoverProps = usePopover();

  const communityId = app.activeChainId() || '';
  const { mutateAsync: createThreadReaction, isPending: isAddingReaction } =
    useCreateThreadReactionMutation({
      communityId,
      threadId: thread.id,
      threadMsgId: thread.canvasMsgId!,
      currentReactionCount: thread.reactionCount || 0,
      currentReactionWeightsSum: `${thread?.reactionWeightsSum || 0}`,
    });
  const { mutateAsync: deleteThreadReaction, isPending: isDeletingReaction } =
    useDeleteThreadReactionMutation({
      communityId,
      address: user.activeAccount?.address || '',
      threadId: thread.id,
      threadMsgId: thread.canvasMsgId!,
      currentReactionCount: thread.reactionCount || 0,
      currentReactionWeightsSum: `${thread?.reactionWeightsSum || 0}`,
    });

  if (showSkeleton) return <ReactionButtonSkeleton />;
  const isLoading = isAddingReaction || isDeletingReaction;

  const handleVoteClick = async (event) => {
    event.stopPropagation();
    event.preventDefault();
    if (isLoading || disabled) return;

    if (!user.isLoggedIn || !user.activeAccount) {
      setIsAuthModalOpen(true);
      return;
    }
    if (hasReacted) {
      if (undoUpvoteDisabled) {
        // for contest threads, users can only upvote because we cannot revert onchain transaction
        return notifyError('Upvotes on contest entries cannot be removed');
      }

      const input = await buildDeleteThreadReactionInput({
        communityId,
        address: user.activeAccount?.address,
        threadId: thread.id!,
        threadMsgId: thread.canvasMsgId!,
        reactionId: +reactedId,
      });
      deleteThreadReaction(input).catch((e) => {
        if (e instanceof SessionKeyError) {
          checkForSessionKeyRevalidationErrors(e);
          return;
        }
        notifyError('Failed to unvote');
        console.error(e?.response?.data?.error || e?.message);
      });
    } else {
      const input = await buildCreateThreadReactionInput({
        communityId,
        address: activeAddress || '',
        threadId: thread.id,
        threadMsgId: thread.canvasMsgId!,
        reactionType: 'like',
      });
      createThreadReaction(input).catch((e) => {
        if (e instanceof SessionKeyError) {
          checkForSessionKeyRevalidationErrors(e);
          return;
        }
        if ((e.message as string)?.includes('Insufficient token balance')) {
          notifyError(
            `You must have ${thread.topic?.token_symbol || 'the required'} tokens to upvote in this topic`,
          );
        } else if (e.message.includes('Must be judge')) {
          notifyError(
            'You must be a judge contest to upvote. Ask community admin for nomination',
          );
        } else if (e.message.includes('Insufficient balance')) {
          notifyError('You must have the requisite tokens to upvote');
        } else {
          notifyError('Failed to upvote');
        }
        console.error(e?.response?.data?.error || e?.message);
      });
    }
  };

  const formattedVoteCount = prettyVoteWeight(
    thread.topic!.weighted_voting
      ? reactionWeightsSum
      : thread.reactionCount.toString(),
    thread.topic!.token_decimals,
    thread.topic!.weighted_voting,
    1,
    size === 'big' ? 1 : 6,
  );

  return (
    <>
      {size === 'small' ? (
        <CWUpvoteSmall
          voteCount={formattedVoteCount}
          disabled={disabled}
          isThreadArchived={!!thread.archivedAt}
          selected={hasReacted}
          onClick={handleVoteClick}
          popoverContent={getDisplayedReactorsForPopup({
            reactors,
          })}
          tooltipText={tooltipText}
          reactors={reactors}
        />
      ) : tooltipText ? (
        <TooltipWrapper disabled={disabled} text={tooltipText}>
          <CWUpvote
            onClick={handleVoteClick}
            voteCount={formattedVoteCount}
            disabled={disabled}
            active={hasReacted}
          />
        </TooltipWrapper>
      ) : (
        <div
          onMouseEnter={popoverProps.handleInteraction}
          onMouseLeave={popoverProps.handleInteraction}
        >
          <CWUpvote
            onClick={handleVoteClick}
            voteCount={formattedVoteCount}
            disabled={disabled}
            active={hasReacted}
          />

          {reactors.length > 0 && (
            <CWPopover
              body={getDisplayedReactorsForPopup({
                reactors,
              })}
              className="popover-content"
              {...popoverProps}
            />
          )}
        </div>
      )}
      <AuthModal
        onClose={() => setIsAuthModalOpen(false)}
        isOpen={isAuthModalOpen}
      />
    </>
  );
};

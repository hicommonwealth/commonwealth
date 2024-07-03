import { notifyError } from 'controllers/app/notifications';
import { SessionKeyError } from 'controllers/server/sessions';
import React, { useState } from 'react';
import app from 'state';
import CWUpvoteSmall from 'views/components/component_kit/new_designs/CWUpvoteSmall';
import { useSessionRevalidationModal } from 'views/modals/SessionRevalidationModal';
import type Comment from '../../../models/Comment';
import {
  useCreateCommentReactionMutation,
  useDeleteCommentReactionMutation,
} from '../../../state/api/comments';
import { AuthModal } from '../../modals/AuthModal';
import { getDisplayedReactorsForPopup } from './helpers';
import useUserStore from 'client/scripts/state/ui/user';

type CommentReactionButtonProps = {
  comment: Comment<any>;
  disabled: boolean;
  tooltipText?: string;
  onReaction?: () => void;
};

export const CommentReactionButton = ({
  comment,
  disabled,
  tooltipText = '',
  onReaction,
}: CommentReactionButtonProps) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const user = useUserStore();

  const {
    mutateAsync: createCommentReaction,
    error: createCommentReactionError,
    reset: resetCreateCommentReaction,
  } = useCreateCommentReactionMutation({
    threadId: comment.threadId,
    commentId: comment.id,
    communityId: app.activeChainId(),
  });
  const {
    mutateAsync: deleteCommentReaction,
    error: deleteCommentReactionError,
    reset: resetDeleteCommentReaction,
  } = useDeleteCommentReactionMutation({
    commentId: comment.id,
    communityId: app.activeChainId(),
    threadId: comment.threadId,
  });

  const resetSessionRevalidationModal = createCommentReactionError
    ? resetCreateCommentReaction
    : resetDeleteCommentReaction;

  const { RevalidationModal } = useSessionRevalidationModal({
    handleClose: resetSessionRevalidationModal,
    error: createCommentReactionError || deleteCommentReactionError,
  });

  const activeAddress = user.activeAccount?.address || '';
  const hasReacted = !!(comment.reactions || []).find(
    (x) => x?.author === activeAddress,
  );
  const reactionWeightsSum = comment.reactions.reduce(
    (acc, curr) => acc + (curr.calculatedVotingWeight || 1),
    0,
  );

  const handleVoteClick = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (!app.isLoggedIn() || !user.activeAccount) {
      setIsAuthModalOpen(true);
      return;
    }

    // @ts-expect-error <StrictNullChecks/>
    onReaction();

    if (hasReacted) {
      const foundReaction = comment.reactions.find((r) => {
        return r.author === activeAddress;
      });
      deleteCommentReaction({
        communityId: app.activeChainId(),
        address: user.activeAccount?.address,
        // @ts-expect-error <StrictNullChecks/>
        canvasHash: foundReaction.canvasHash,
        // @ts-expect-error <StrictNullChecks/>
        reactionId: foundReaction.id,
      }).catch((err) => {
        if (err instanceof SessionKeyError) {
          return;
        }
        console.error(err.response.data.error || err?.message);
        notifyError('Failed to update reaction count');
      });
    } else {
      createCommentReaction({
        address: activeAddress,
        commentId: comment.id,
        communityId: app.activeChainId(),
        threadId: comment.threadId,
      }).catch((err) => {
        if (err instanceof SessionKeyError) {
          return;
        }
        console.error(err?.responseJSON?.error || err?.message);
        notifyError('Failed to save reaction');
      });
    }
  };

  return (
    <>
      <AuthModal
        onClose={() => setIsAuthModalOpen(false)}
        isOpen={isAuthModalOpen}
      />
      {RevalidationModal}
      <CWUpvoteSmall
        voteCount={reactionWeightsSum}
        disabled={!user.activeAccount || disabled}
        selected={hasReacted}
        onClick={handleVoteClick}
        popoverContent={getDisplayedReactorsForPopup({
          reactors: (comment.reactions || []).map((r) => r.author),
        })}
        tooltipText={tooltipText}
      />
    </>
  );
};

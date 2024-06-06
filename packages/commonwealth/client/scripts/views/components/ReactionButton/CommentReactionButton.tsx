import { notifyError } from 'controllers/app/notifications';
import { SessionKeyError } from 'controllers/server/sessions';
import useUserActiveAccount from 'hooks/useUserActiveAccount';
import React, { useState } from 'react';
import app from 'state';
import CWUpvoteSmall from 'views/components/component_kit/new_designs/CWUpvoteSmall';
import type Comment from '../../../models/Comment';
import {
  useCreateCommentReactionMutation,
  useDeleteCommentReactionMutation,
} from '../../../state/api/comments';
import { AuthModal } from '../../modals/AuthModal';
import { getDisplayedReactorsForPopup } from './helpers';

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
  const { activeAccount: hasJoinedCommunity } = useUserActiveAccount();

  const { mutateAsync: createCommentReaction } =
    useCreateCommentReactionMutation({
      threadId: comment.threadId,
      commentId: comment.id,
      communityId: app.activeChainId(),
    });

  const { mutateAsync: deleteCommentReaction } =
    useDeleteCommentReactionMutation({
      commentId: comment.id,
      communityId: app.activeChainId(),
      threadId: comment.threadId,
    });

  const activeAddress = app.user.activeAccount?.address;
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

    if (!app.isLoggedIn() || !app.user.activeAccount) {
      setIsAuthModalOpen(true);
      return;
    }

    onReaction();

    if (hasReacted) {
      const foundReaction = comment.reactions.find((r) => {
        return r.author === activeAddress;
      });
      deleteCommentReaction({
        communityId: app.activeChainId(),
        address: app.user.activeAccount.address,
        canvasHash: foundReaction.canvasHash,
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
      <CWUpvoteSmall
        voteCount={reactionWeightsSum}
        disabled={!hasJoinedCommunity || disabled}
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

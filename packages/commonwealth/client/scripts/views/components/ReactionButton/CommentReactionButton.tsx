import { buildCreateCommentReactionInput } from 'client/scripts/state/api/comments/createReaction';
import { buildDeleteCommentReactionInput } from 'client/scripts/state/api/comments/deleteReaction';
import { useAuthModalStore } from 'client/scripts/state/ui/modals';
import { notifyError } from 'controllers/app/notifications';
import { SessionKeyError } from 'controllers/server/sessions';
import React, { useState } from 'react';
import app from 'state';
import useUserStore from 'state/ui/user';
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
  const user = useUserStore();
  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();

  const { mutateAsync: createCommentReaction } =
    useCreateCommentReactionMutation({
      threadId: comment.threadId,
      commentId: comment.id,
      communityId: app.activeChainId(),
    });

  const communityId = app.activeChainId() || '';
  const { mutateAsync: deleteCommentReaction } =
    useDeleteCommentReactionMutation({
      commentId: comment.id,
      communityId,
      threadId: comment.threadId,
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

    if (!user.isLoggedIn || !user.activeAccount) {
      setIsAuthModalOpen(true);
      return;
    }

    // @ts-expect-error <StrictNullChecks/>
    onReaction();

    if (hasReacted) {
      const foundReaction = comment.reactions.find((r) => {
        return r.author === activeAddress;
      });
      if (!foundReaction) {
        console.error('missing reaction');
        notifyError('Failed to update reaction count');
        return;
      }
      const input = await buildDeleteCommentReactionInput({
        communityId,
        address: user.activeAccount?.address,
        commentMsgId: comment.canvasMsgId,
        reactionId: foundReaction.id,
      });
      deleteCommentReaction(input).catch((err) => {
        if (err instanceof SessionKeyError) {
          checkForSessionKeyRevalidationErrors(err);
          return;
        }
        console.error(err?.message);
        notifyError('Failed to update reaction count');
      });
    } else {
      const input = await buildCreateCommentReactionInput({
        address: activeAddress,
        commentId: comment.id,
        communityId,
        threadId: comment.threadId,
        commentMsgId: comment.canvasMsgId,
      });
      createCommentReaction(input).catch((err) => {
        if (err instanceof SessionKeyError) {
          checkForSessionKeyRevalidationErrors(err);
          return;
        }
        console.error(err?.message);
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

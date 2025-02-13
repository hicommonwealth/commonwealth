import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import { buildCreateCommentReactionInput } from 'client/scripts/state/api/comments/createReaction';
import { buildDeleteCommentReactionInput } from 'client/scripts/state/api/comments/deleteReaction';
import { useAuthModalStore } from 'client/scripts/state/ui/modals';
import { notifyError } from 'controllers/app/notifications';
import { SessionKeyError } from 'controllers/server/sessions';
import { BigNumber } from 'ethers';
import React, { useState } from 'react';
import { prettyVoteWeight } from 'shared/adapters/currency';
import app from 'state';
import useUserStore from 'state/ui/user';
import CWUpvoteSmall from 'views/components/component_kit/new_designs/CWUpvoteSmall';
import {
  useCreateCommentReactionMutation,
  useDeleteCommentReactionMutation,
} from '../../../state/api/comments';
import { AuthModal } from '../../modals/AuthModal';
import { CommentViewParams } from '../../pages/discussions/CommentCard/CommentCard';
import { getDisplayedReactorsForPopup } from './helpers';

type CommentReactionButtonProps = {
  comment: CommentViewParams;
  disabled: boolean;
  tooltipText?: string;
  onReaction?: () => void;
  weightType?: TopicWeightedVoting | null;
};

export const CommentReactionButton = ({
  comment,
  disabled,
  tooltipText = '',
  onReaction,
  weightType,
}: CommentReactionButtonProps) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const user = useUserStore();
  const { checkForSessionKeyRevalidationErrors } = useAuthModalStore();

  const { mutateAsync: createCommentReaction } =
    useCreateCommentReactionMutation();

  const communityId = app.activeChainId() || '';
  const { mutateAsync: deleteCommentReaction } =
    useDeleteCommentReactionMutation();

  const activeAddress = user.activeAccount?.address || '';
  const hasReacted = !!(comment.reactions || []).find(
    (x) => x?.address === activeAddress,
  );
  const reactionWeightsSum = (comment.reactions || []).reduce(
    (acc, reaction) => acc.add(reaction.calculated_voting_weight || 1),
    BigNumber.from(0),
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
      const foundReaction = (comment.reactions || []).find((r) => {
        return r.address === activeAddress;
      });
      if (!foundReaction) {
        console.error('missing reaction');
        notifyError('Failed to update reaction count');
        return;
      }
      const input = await buildDeleteCommentReactionInput({
        communityId,
        address: user.activeAccount?.address,
        commentMsgId: comment.canvas_msg_id || '',
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
        threadId: comment.thread_id,
        commentMsgId: comment.canvas_msg_id || '',
      });
      createCommentReaction(input).catch((err) => {
        if (err instanceof SessionKeyError) {
          checkForSessionKeyRevalidationErrors(err);
          return;
        }
        if ((err.message as string)?.includes('Insufficient token balance')) {
          notifyError(
            'You must have the requisite tokens to upvote in this topic',
          );
        } else {
          notifyError('Failed to save reaction');
        }
        console.error(err?.message);
      });
    }
  };

  const formattedVoteCount = prettyVoteWeight(
    reactionWeightsSum.toString(),
    weightType,
    1,
    6,
  );

  return (
    <>
      <AuthModal
        onClose={() => setIsAuthModalOpen(false)}
        isOpen={isAuthModalOpen}
      />
      <CWUpvoteSmall
        voteCount={formattedVoteCount}
        disabled={!user.activeAccount || disabled}
        selected={hasReacted}
        onClick={handleVoteClick}
        popoverContent={getDisplayedReactorsForPopup({
          reactors: (comment.reactions || [])
            .map((r) => r.address || '')
            .filter(Boolean), // TODO: fix type, address should be defined
        })}
        tooltipText={tooltipText}
      />
    </>
  );
};

import { notifyError } from 'controllers/app/notifications';
import { SessionKeyError } from 'controllers/server/sessions';
import useUserActiveAccount from 'hooks/useUserActiveAccount';
import React, { useState } from 'react';
import app from 'state';
import CWUpvoteSmall from 'views/components/component_kit/new_designs/CWUpvoteSmall';
import { useSessionRevalidationModal } from 'views/modals/SessionRevalidationModal';
import { useFlag } from '../../../hooks/useFlag';
import type Comment from '../../../models/Comment';
import {
  useCreateCommentReactionMutation,
  useDeleteCommentReactionMutation,
} from '../../../state/api/comments';
import { AuthModal } from '../../modals/AuthModal';
import { LoginModal } from '../../modals/login_modal';
import { isWindowMediumSmallInclusive } from '../component_kit/helpers';
import { CWModal } from '../component_kit/new_designs/CWModal';
import { getDisplayedReactorsForPopup } from './helpers';

type CommentReactionButtonProps = {
  comment: Comment<any>;
  voteWeight?: number;
  disabled: boolean;
  tooltipText?: string;
  onReaction?: () => void;
};

export const CommentReactionButton = ({
  comment,
  voteWeight,
  disabled,
  tooltipText = '',
  onReaction,
}: CommentReactionButtonProps) => {
  const newSignInModalEnabled = useFlag('newSignInModal');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const { activeAccount: hasJoinedCommunity } = useUserActiveAccount();

  const {
    mutateAsync: createCommentReaction,
    error: createCommentReactionError,
    reset: resetCreateCommentReaction,
  } = useCreateCommentReactionMutation({
    threadId: comment.threadId,
    commentId: comment.id,
    communityId: app.activeChainId(),
    voteWeight: voteWeight,
  });
  const {
    mutateAsync: deleteCommentReaction,
    error: deleteCommentReactionError,
    reset: resetDeleteCommentReaction,
  } = useDeleteCommentReactionMutation({
    commentId: comment.id,
    communityId: app.activeChainId(),
    threadId: comment.threadId,
    voteWeight: voteWeight,
  });

  const resetSessionRevalidationModal = createCommentReactionError
    ? resetCreateCommentReaction
    : resetDeleteCommentReaction;

  const { RevalidationModal } = useSessionRevalidationModal({
    handleClose: resetSessionRevalidationModal,
    error: createCommentReactionError || deleteCommentReactionError,
  });

  const activeAddress = app.user.activeAccount?.address;
  const hasReacted = !!(comment.reactions || []).find(
    (x) => x?.author === activeAddress,
  );
  const likes = comment.reactionWeightsSum || comment.reactions.length;

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
      {!newSignInModalEnabled ? (
        <CWModal
          content={
            <LoginModal onModalClose={() => setIsAuthModalOpen(false)} />
          }
          isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
          onClose={() => setIsAuthModalOpen(false)}
          open={isAuthModalOpen}
        />
      ) : (
        <AuthModal
          onClose={() => setIsAuthModalOpen(false)}
          isOpen={isAuthModalOpen}
        />
      )}
      {RevalidationModal}
      <CWUpvoteSmall
        voteCount={likes}
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

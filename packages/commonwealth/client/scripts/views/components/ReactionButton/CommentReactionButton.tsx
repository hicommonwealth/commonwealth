import { notifyError } from 'controllers/app/notifications';
import React, { useState } from 'react';
import app from 'state';
import CWUpvoteSmall from 'views/components/component_kit/new_designs/CWUpvoteSmall';
import type Comment from '../../../models/Comment';
import {
  useCreateCommentReactionMutation,
  useDeleteCommentReactionMutation,
} from '../../../state/api/comments';
import { LoginModal } from '../../modals/login_modal';
import { Modal } from '../component_kit/cw_modal';
import { isWindowMediumSmallInclusive } from '../component_kit/helpers';
import { getDisplayedReactorsForPopup } from './helpers';
import { SessionKeyError } from 'controllers/server/sessions';
import SessionRevalidationModal from 'views/modals/SessionRevalidationModal';

type CommentReactionButtonProps = {
  comment: Comment<any>;
  disabled: boolean;
};

export const CommentReactionButton = ({
  comment,
  disabled,
}: CommentReactionButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const {
    mutateAsync: createCommentReaction,
    error: createCommentReactionError,
    reset: resetCreateCommentReaction,
  } = useCreateCommentReactionMutation({
    threadId: comment.threadId,
    commentId: comment.id,
    chainId: app.activeChainId(),
  });
  const {
    mutateAsync: deleteCommentReaction,
    error: deleteCommentReactionError,
    reset: resetDeleteCommentReaction,
  } = useDeleteCommentReactionMutation({
    commentId: comment.id,
    chainId: app.activeChainId(),
    threadId: comment.threadId,
  });

  const activeAddress = app.user.activeAccount?.address;
  const hasReacted = !!(comment.reactions || []).find(
    (x) => x?.author === activeAddress
  );
  const likes = (comment.reactions || []).length;

  const handleVoteClick = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (!app.isLoggedIn() || !app.user.activeAccount) {
      setIsModalOpen(true);
      return;
    }

    if (hasReacted) {
      const foundReaction = comment.reactions.find((r) => {
        return r.author === activeAddress;
      });
      deleteCommentReaction({
        chainId: app.activeChainId(),
        address: app.user.activeAccount.address,
        canvasHash: foundReaction.canvasHash,
        reactionId: foundReaction.id,
      }).catch((err) => {
        if (err instanceof SessionKeyError) {
          return;
        }
        console.error(err?.responseJSON?.error || err?.message);
        notifyError('Failed to update reaction count');
      });
    } else {
      createCommentReaction({
        address: activeAddress,
        commentId: comment.id,
        chainId: app.activeChainId(),
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

  const sessionKeyValidationError =
    (createCommentReactionError instanceof SessionKeyError &&
      createCommentReactionError) ||
    (deleteCommentReactionError instanceof SessionKeyError &&
      deleteCommentReactionError);

  const resetSessionRevalidationModal = createCommentReactionError
    ? resetCreateCommentReaction
    : resetDeleteCommentReaction;

  return (
    <>
      <Modal
        content={<LoginModal onModalClose={() => setIsModalOpen(false)} />}
        isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
      <Modal
        isFullScreen={false}
        content={
          <SessionRevalidationModal
            onModalClose={resetSessionRevalidationModal}
            walletSsoSource={sessionKeyValidationError.ssoSource}
            walletAddress={sessionKeyValidationError.address}
          />
        }
        onClose={resetSessionRevalidationModal}
        open={!!sessionKeyValidationError}
      />
      <CWUpvoteSmall
        voteCount={likes}
        disabled={disabled}
        selected={hasReacted}
        onMouseEnter={() => undefined}
        onClick={handleVoteClick}
        tooltipContent={getDisplayedReactorsForPopup({
          reactors: (comment.reactions || []).map((r) => r.author),
        })}
      />
    </>
  );
};

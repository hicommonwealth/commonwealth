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
import { CWModal } from '../component_kit/new_designs/CWModal';
import { isWindowMediumSmallInclusive } from '../component_kit/helpers';
import { getDisplayedReactorsForPopup } from './helpers';
import useUserActiveAccount from 'hooks/useUserActiveAccount';
import { SessionKeyError } from 'controllers/server/sessions';
import { useSessionRevalidationModal } from 'views/modals/SessionRevalidationModal';

type CommentReactionButtonProps = {
  comment: Comment<any>;
  disabled: boolean;
};

export const CommentReactionButton = ({
  comment,
  disabled,
}: CommentReactionButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const { activeAccount: hasJoinedCommunity } = useUserActiveAccount();

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

  const resetSessionRevalidationModal = createCommentReactionError
    ? resetCreateCommentReaction
    : resetDeleteCommentReaction;

  const { RevalidationModal } = useSessionRevalidationModal({
    handleClose: resetSessionRevalidationModal,
    error: createCommentReactionError || deleteCommentReactionError,
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

  return (
    <>
      <CWModal
        content={<LoginModal onModalClose={() => setIsModalOpen(false)} />}
        isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
      {RevalidationModal}
      <CWUpvoteSmall
        voteCount={likes}
        disabled={!hasJoinedCommunity || disabled}
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

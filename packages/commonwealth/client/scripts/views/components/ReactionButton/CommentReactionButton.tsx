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

type CommentReactionButtonProps = {
  comment: Comment<any>;
  disabled: boolean;
};

export const CommentReactionButton = ({
  comment,
  disabled,
}: CommentReactionButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const { mutateAsync: createCommentReaction } =
    useCreateCommentReactionMutation({
      threadId: comment.threadId,
      commentId: comment.id,
      chainId: app.activeChainId(),
    });
  const { mutateAsync: deleteCommentReaction } =
    useDeleteCommentReactionMutation({
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
      }).catch(() => {
        notifyError('Failed to update reaction count');
      });
    } else {
      createCommentReaction({
        address: activeAddress,
        commentId: comment.id,
        chainId: app.activeChainId(),
        threadId: comment.threadId,
      }).catch(() => {
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

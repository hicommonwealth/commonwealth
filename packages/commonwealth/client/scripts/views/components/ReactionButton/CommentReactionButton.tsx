import { notifyError } from 'controllers/app/notifications';
import React, { useState } from 'react';
import app from 'state';
import CWUpvoteSmall from 'views/components/component_kit/new_designs/CWUpvoteSmall';
import type Comment from '../../../models/Comment';
import {
  useCreateCommentReactionMutation,
  useDeleteCommentReactionMutation,
  useFetchCommentReactionsQuery,
} from '../../../state/api/comments';
import { LoginModal } from '../../modals/login_modal';
import { Modal } from '../component_kit/cw_modal';
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
      commentId: comment.id,
      chainId: app.activeChainId(),
    });
  const { mutateAsync: deleteCommentReaction } =
    useDeleteCommentReactionMutation({
      commentId: comment.id,
      chainId: app.activeChainId(),
    });
  const { data: reactions } = useFetchCommentReactionsQuery({
    chainId: app.activeChainId(),
    commentId: comment.id,
  });

  const activeAddress = app.user.activeAccount?.address;
  const hasReacted = (reactions || []).find(
    (x) => x?.Address?.address === activeAddress
  );
  const likes = (reactions || []).length;

  const handleVoteClick = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (!app.isLoggedIn() || !app.user.activeAccount) {
      setIsModalOpen(true);
      return;
    }

    if (hasReacted) {
      const foundReaction = reactions.find((r) => {
        return r.Address.address === activeAddress;
      });
      deleteCommentReaction({
        canvasHash: foundReaction.canvas_hash,
        reactionId: foundReaction.id,
      }).catch(() => {
        notifyError('Failed to update reaction count');
      });
    } else {
      createCommentReaction({
        address: activeAddress,
        commentId: comment.id,
        chainId: app.activeChainId(),
      }).catch(() => {
        notifyError('Failed to save reaction');
      });
    }
  };

  return (
    <>
      <Modal
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
          reactors: (reactions || []).map((r) => r.Address.address),
        })}
      />
    </>
  );
};

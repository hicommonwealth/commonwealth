import React, { useState, useEffect } from 'react';
import 'components/ReactionButton/CommentReactionButton.scss';
import { notifyError } from 'controllers/app/notifications';
import app from 'state';
import type ChainInfo from '../../../models/ChainInfo';
import type Comment from '../../../models/Comment';
import ReactionCount from '../../../models/ReactionCount';
import {
  useCreateCommentReactionMutation,
  useDeleteCommentReactionMutation,
  useFetchCommentReactionsQuery
} from '../../../state/api/comments';
import Permissions from '../../../utils/Permissions';
import { LoginModal } from '../../modals/login_modal';
import { Modal } from '../component_kit/cw_modal';
import { isWindowMediumSmallInclusive } from '../component_kit/helpers';
import {
  getDisplayedReactorsForPopup,
  onReactionClick,
} from './helpers';
import CWUpvoteSmall from 'views/components/component_kit/new_designs/CWUpvoteSmall';

type CommentReactionButtonProps = {
  comment: Comment<any>;
  disabled: boolean;
};

export const CommentReactionButton = ({
  comment,
  disabled,
}: CommentReactionButtonProps) => {
  const [reactors, setReactors] = useState<Array<any>>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [reactionCounts, setReactionCounts] = useState<ReactionCount<any>>();
  const { mutateAsync: createCommentReaction } = useCreateCommentReactionMutation({
    commentId: comment.id,
    chainId: app.activeChainId()
  })
  const { mutateAsync: deleteCommentReaction } = useDeleteCommentReactionMutation({
    commentId: comment.id,
    chainId: app.activeChainId()
  })
  const { data: reactions } = useFetchCommentReactionsQuery({
    chainId: app.activeChainId(),
    commentId: comment.id,
  })

  useEffect(() => {
    const redrawFunction = (comment_id) => {
      if (comment_id !== comment.id) {
        return;
      }

      setReactionCounts(app.comments.reactionCountsStore.getByPost(comment));
    };

    app.comments.isReactionFetched.on('redraw', redrawFunction);

    return () => {
      app.comments.isReactionFetched.off('redraw', redrawFunction);
    };
  });

  const { likes = 0, hasReacted } = reactionCounts || {};

  // token balance check if needed
  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();

  const parentThread = app.threads.getById(comment.threadId);

  const topicId = parentThread?.topic?.id;

  const isUserForbidden = !isAdmin && app.chain.isGatedTopic(topicId);

  const activeAddress = app.user.activeAccount?.address;

  const dislike = async (userAddress: string) => {
    const foundReaction = reactions.find((r) => {
      return r.Address.address === activeAddress;
    });

    deleteCommentReaction({
      canvasHash: foundReaction.canvas_hash,
      reactionId: foundReaction.id,
      reactionCount: {
        ...reactionCounts,
        likes: likes - 1,
        hasReacted: false,
      },
    }).then(() => {
      setReactors(
        reactors.filter(({ Address }) => Address.address !== userAddress)
      );
      setReactionCounts(app.comments.reactionCountsStore.getByPost(comment));
    }).catch(() => {
      notifyError('Failed to update reaction count');
    });
  };

  const like = (chain: ChainInfo, chainId: string, userAddress: string) => {
    createCommentReaction({
      address: userAddress,
      commentId: comment.id,
      chainId: chainId,
    }).then(() => {
      setReactors([
        ...reactors,
        { Address: { address: userAddress, chain } },
      ]);
      setReactionCounts(app.comments.reactionCountsStore.getByPost(comment));
    }).catch(() => {
      notifyError('Failed to save reaction');
    })
  };

  const handleVoteClick = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (!app.isLoggedIn() || !app.user.activeAccount) {
      setIsModalOpen(true);
    } else {
      onReactionClick(e, hasReacted, dislike, like);
    }
  };

  const handleVoteMouseEnter = async () => {
    setReactors(reactions);
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
        disabled={isUserForbidden || disabled}
        selected={hasReacted}
        onMouseEnter={handleVoteMouseEnter}
        onClick={handleVoteClick}
        tooltipContent={getDisplayedReactorsForPopup({
          reactors: reactors.map((r) => r.Address.address),
        })}
      />
    </>
  );
};

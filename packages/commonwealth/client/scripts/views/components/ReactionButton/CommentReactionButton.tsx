import 'components/ReactionButton/CommentReactionButton.scss';

import React, { useState, useEffect } from 'react';
import app from 'state';
import type ChainInfo from '../../../models/ChainInfo';
import type Comment from '../../../models/Comment';
import Permissions from '../../../utils/Permissions';
import { LoginModal } from '../../modals/login_modal';
import ReactionCount from '../../../models/ReactionCount';
import { Modal } from '../component_kit/cw_modal';
import { isWindowMediumSmallInclusive } from '../component_kit/helpers';
import {
  fetchReactionsByComment,
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

  useEffect(() => {
    const redrawFunction = (comment_id) => {
      if (comment_id !== comment.id) {
        return;
      }

      setReactionCounts(app.reactionCounts.store.getByPost(comment));
    };

    app.reactionCounts.isFetched.on('redraw', redrawFunction);

    return () => {
      app.reactionCounts.isFetched.off('redraw', redrawFunction);
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
    const reaction = (await fetchReactionsByComment(comment.id)).find((r) => {
      return r.Address.address === activeAddress;
    });

    app.reactionCounts
      .delete(reaction, {
        ...reactionCounts,
        likes: likes - 1,
        hasReacted: false,
      })
      .then(() => {
        setReactors(
          reactors.filter(({ Address }) => Address.address !== userAddress)
        );

        setReactionCounts(app.reactionCounts.store.getByPost(comment));
      });
  };

  const like = (chain: ChainInfo, chainId: string, userAddress: string) => {
    app.reactionCounts
      .createCommentReaction(userAddress, comment, 'like', chainId)
      .then(() => {
        setReactors([
          ...reactors,
          {
            Address: { address: userAddress, chain },
          },
        ]);

        setReactionCounts(app.reactionCounts.store.getByPost(comment));
      });
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
    setReactors(await fetchReactionsByComment(comment.id));
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

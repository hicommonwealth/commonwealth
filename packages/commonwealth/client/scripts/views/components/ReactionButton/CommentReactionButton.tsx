import 'components/ReactionButton/CommentReactionButton.scss';
import React, { useState, useEffect } from 'react';
import app from 'state';
import type ChainInfo from '../../../models/ChainInfo';
import type Comment from '../../../models/Comment';
import Permissions from '../../../utils/Permissions';
import { LoginModal } from '../../modals/login_modal';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import ReactionCount from '../../../models/ReactionCount';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { CWText } from '../component_kit/cw_text';
import { Modal } from '../component_kit/cw_modal';
import { CWTooltip } from '../component_kit/cw_popover/cw_tooltip';
import {
  getClasses,
  isWindowMediumSmallInclusive,
} from '../component_kit/helpers';
import {
  fetchReactionsByComment,
  getDisplayedReactorsForPopup,
  onReactionClick,
} from './helpers';

type CommentReactionButtonProps = {
  comment: Comment<any>;
};

export const CommentReactionButton = ({
  comment,
}: CommentReactionButtonProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
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

  const topicName = parentThread?.topic?.name;

  const isUserForbidden = !isAdmin && app.chain.isGatedTopic(topicName);

  const activeAddress = app.user.activeAccount?.address;

  const dislike = async (userAddress: string) => {
    const reaction = (await fetchReactionsByComment(comment.id)).find((r) => {
      return r.Address.address === activeAddress;
    });

    setIsLoading(true);

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
        setIsLoading(false);
      });
  };

  const like = (chain: ChainInfo, chainId: string, userAddress: string) => {
    setIsLoading(true);

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
        setIsLoading(false);
      });
  };

  return (
    <>
      <Modal
        content={<LoginModal onModalClose={() => setIsModalOpen(false)} />}
        isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
      <button
        className={getClasses<{ disabled?: boolean }>(
          { disabled: isLoading || isUserForbidden },
          `CommentReactionButton ${hasReacted ? ' has-reacted' : ''}`
        )}
        onMouseEnter={async () => {
          setReactors(await fetchReactionsByComment(comment.id));
        }}
        onClick={async (e) => {
          e.stopPropagation();
          e.preventDefault();

          if (!app.isLoggedIn() || !app.user.activeAccount) {
            setIsModalOpen(true);
          } else {
            onReactionClick(e, hasReacted, dislike, like);
          }
        }}
      >
        {likes > 0 ? (
          <CWTooltip
            content={
              <div className="reaction-button-tooltip-contents">
                {getDisplayedReactorsForPopup({
                  reactors: reactors.map((r) => r.Address.address),
                })}
              </div>
            }
            renderTrigger={(handleInteraction) => (
              <div
                onMouseEnter={handleInteraction}
                onMouseLeave={handleInteraction}
                className="btn-container"
              >
                <CWIcon
                  iconName="upvote"
                  iconSize="small"
                  {...(hasReacted && { weight: 'fill' })}
                />
                <div
                  className={`reactions-count ${
                    hasReacted ? ' has-reacted' : ''
                  }`}
                >
                  {likes}
                </div>
              </div>
            )}
          />
        ) : (
          <>
            <CWIcon iconName="upvote" iconSize="small" />
            <div
              className={`reactions-count ${hasReacted ? ' has-reacted' : ''}`}
            >
              {likes}
            </div>
          </>
        )}
      </button>
    </>
  );
};

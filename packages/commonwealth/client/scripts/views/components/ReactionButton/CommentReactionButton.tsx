import 'components/ReactionButton/CommentReactionButton.scss';
import { notifyError } from 'controllers/app/notifications';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import React, { useEffect, useState } from 'react';
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
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { Modal } from '../component_kit/cw_modal';
import { CWTooltip } from '../component_kit/cw_popover/cw_tooltip';
import {
  getClasses,
  isWindowMediumSmallInclusive,
} from '../component_kit/helpers';
import {
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

  const topicName = parentThread?.topic?.name;

  const isUserForbidden = !isAdmin && TopicGateCheck.isGatedTopic(topicName);

  const activeAddress = app.user.activeAccount?.address;

  const dislike = async (userAddress: string) => {
    const foundReaction = reactions.find((r) => {
      return r.Address.address === activeAddress;
    });

    setIsLoading(true);

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
      setIsLoading(false);
    }).catch(() => {
      notifyError('Failed to update reaction count');
    });
  };

  const like = (chain: ChainInfo, chainId: string, userAddress: string) => {
    setIsLoading(true);

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
      setIsLoading(false);
    }).catch(() => {
      notifyError('Failed to save reaction');
    })
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
        // TODO: won't be needed now?
        onMouseEnter={async () => {
          setReactors(reactions);
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
                  className={`reactions-count ${hasReacted ? ' has-reacted' : ''
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

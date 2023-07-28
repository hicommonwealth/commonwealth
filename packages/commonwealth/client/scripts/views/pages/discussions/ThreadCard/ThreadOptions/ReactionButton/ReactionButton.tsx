import type ChainInfo from 'models/ChainInfo';
import type Thread from 'models/Thread';
import React, { useState } from 'react';
import app from 'state';
import { useCreateThreadReactionMutation, useDeleteThreadReactionMutation } from 'state/api/threads';
import Permissions from 'utils/Permissions';
import {
  getDisplayedReactorsForPopup,
  onReactionClick,
} from 'views/components/ReactionButton/helpers';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { Modal } from 'views/components/component_kit/cw_modal';
import { CWTooltip } from 'views/components/component_kit/cw_popover/cw_tooltip';
import { isWindowMediumSmallInclusive } from 'views/components/component_kit/helpers';
import CWUpvoteSmall from 'views/components/component_kit/new_designs/CWUpvoteSmall';
import { LoginModal } from '../../../../../modals/login_modal';
import './ReactionButton.scss';

type ReactionButtonProps = {
  thread: Thread;
  size: 'small' | 'big';
  disabled: boolean;
};

export const ReactionButton = ({
  thread,
  size,
  disabled,
}: ReactionButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const reactors = thread.associatedReactions.map((t) => t.address)
  const activeAddress = app.user.activeAccount?.address;
  const thisUserReaction = thread.associatedReactions.filter(
    (r) => r.address === activeAddress
  );
  const hasReacted = thisUserReaction.length !== 0;
  const reactedId = thisUserReaction.length === 0 ? -1 : thisUserReaction[0].id

  const { mutateAsync: createThreadReaction, isLoading: isAddingReaction } = useCreateThreadReactionMutation({
    chainId: app.activeChainId(),
    threadId: thread.id
  });
  const { mutateAsync: deleteThreadReaction, isLoading: isDeletingReaction } = useDeleteThreadReactionMutation({
    chainId: app.activeChainId(),
    threadId: thread.id
  });

  const isLoading = isAddingReaction || isDeletingReaction

  // token balance check if needed
  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();
  const isUserForbidden = !isAdmin && app.chain.isGatedTopic(thread.topic?.id);

  const dislike = async () => {
    if (!hasReacted || isLoading) {
      return;
    }

    deleteThreadReaction({ chainId: app.activeChainId(), threadId: thread.id, reactionId: reactedId as number })
      .catch((e) => {
        console.log(e);
      })
  };

  const like = async (
    chain: ChainInfo,
    chainId: string,
    userAddress: string
  ) => {
    if (hasReacted || isLoading) {
      return;
    }

    createThreadReaction({
      chainId: app.activeChainId(),
      address: userAddress,
      threadId: thread.id,
      reactionType: 'like'
    }).catch((e) => {
      console.log(e);
    })
  };

  const handleSmallVoteClick = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!app.isLoggedIn() || !app.user.activeAccount) {
      setIsModalOpen(true);
    } else {
      onReactionClick(e, hasReacted, dislike, like);
    }
  };

  return (
    <>
      {size === 'small' ? (
        <CWUpvoteSmall
          voteCount={reactors.length}
          disabled={isUserForbidden || disabled}
          selected={hasReacted}
          onMouseEnter={() => undefined}
          onClick={handleSmallVoteClick}
          tooltipContent={getDisplayedReactorsForPopup({
            reactors: reactors,
          })}
        />
      ) : (
        <button
          onClick={async (e) => {
            e.stopPropagation();
            e.preventDefault();

            if (!app.isLoggedIn() || !app.user.activeAccount) {
              setIsModalOpen(true);
            } else {
              onReactionClick(e, hasReacted, dislike, like);
            }
          }}
          className={`ThreadReactionButton ${isLoading || isUserForbidden ? ' disabled' : ''
            }${hasReacted ? ' has-reacted' : ''}`}
        >
          {reactors.length > 0 ? (
            <CWTooltip
              content={getDisplayedReactorsForPopup({
                reactors,
              })}
              renderTrigger={(handleInteraction) => (
                <div
                  onMouseEnter={handleInteraction}
                  onMouseLeave={handleInteraction}
                >
                  <div className="reactions-container">
                    <CWIcon
                      iconName="upvote"
                      iconSize="small"
                      {...(hasReacted && { weight: 'fill' })}
                    />
                    <div
                      className={`reactions-count ${hasReacted ? ' has-reacted' : ''
                        }`}
                    >
                      {reactors.length}
                    </div>
                  </div>
                </div>
              )}
            />
          ) : (
            <div className="reactions-container">
              <CWIcon iconName="upvote" iconSize="small" />
              <div
                className={`reactions-count ${hasReacted ? ' has-reacted' : ''
                  }`}
              >
                {reactors.length}
              </div>
            </div>
          )}
        </button>
      )}
      <Modal
        content={<LoginModal onModalClose={() => setIsModalOpen(false)} />}
        isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
    </>
  );
};

import type Thread from 'models/Thread';
import React, { useState } from 'react';
import app from 'state';
import {
  useCreateThreadReactionMutation,
  useDeleteThreadReactionMutation,
} from 'state/api/threads';
import Permissions from 'utils/Permissions';
import { getDisplayedReactorsForPopup } from 'views/components/ReactionButton/helpers';
import { Modal } from 'views/components/component_kit/cw_modal';
import { CWTooltip } from 'views/components/component_kit/cw_popover/cw_tooltip';
import { isWindowMediumSmallInclusive } from 'views/components/component_kit/helpers';
import CWUpvoteSmall from 'views/components/component_kit/new_designs/CWUpvoteSmall';
import { LoginModal } from '../../../../../modals/login_modal';
import { ReactionButtonSkeleton } from './ReactionButtonSkeleton';
import { TooltipWrapper } from 'views/components/component_kit/new_designs/cw_thread_action';
import { useSessionRevalidationModal } from 'views/modals/SessionRevalidationModal';
import { SessionKeyError } from 'controllers/server/sessions';
import { CWUpvote } from 'views/components/component_kit/new_designs/cw_upvote';

type ReactionButtonProps = {
  thread: Thread;
  size: 'small' | 'big';
  showSkeleton?: boolean;
  disabled: boolean;
};

export const ReactionButton = ({
  thread,
  size,
  disabled,
  showSkeleton,
}: ReactionButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const reactors = thread?.associatedReactions?.map((t) => t.address);
  const activeAddress = app.user.activeAccount?.address;
  const thisUserReaction = thread?.associatedReactions?.filter(
    (r) => r.address === activeAddress
  );
  const hasReacted = thisUserReaction?.length !== 0;
  const reactedId =
    thisUserReaction?.length === 0 ? -1 : thisUserReaction?.[0]?.id;

  const {
    mutateAsync: createThreadReaction,
    isLoading: isAddingReaction,
    error: createThreadReactionError,
    reset: resetCreateThreadReactionMutation,
  } = useCreateThreadReactionMutation({
    chainId: app.activeChainId(),
    threadId: thread.id,
  });
  const {
    mutateAsync: deleteThreadReaction,
    isLoading: isDeletingReaction,
    error: deleteThreadReactionError,
    reset: resetDeleteThreadReactionMutation,
  } = useDeleteThreadReactionMutation({
    chainId: app.activeChainId(),
    address: app.user.activeAccount?.address,
    threadId: thread.id,
  });

  const resetSessionRevalidationModal = createThreadReactionError
    ? resetCreateThreadReactionMutation
    : resetDeleteThreadReactionMutation;

  const { RevalidationModal } = useSessionRevalidationModal({
    handleClose: resetSessionRevalidationModal,
    error: createThreadReactionError || deleteThreadReactionError,
  });

  if (showSkeleton) return <ReactionButtonSkeleton />;
  const isLoading = isAddingReaction || isDeletingReaction;

  // token balance check if needed
  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();
  const isUserForbidden = !isAdmin && app.chain.isGatedTopic(thread.topic?.id);

  const handleVoteClick = async (event) => {
    event.stopPropagation();
    event.preventDefault();
    if (isLoading || disabled) return;

    if (!app.isLoggedIn() || !app.user.activeAccount) {
      setIsModalOpen(true);
      return;
    }
    if (hasReacted) {
      deleteThreadReaction({
        chainId: app.activeChainId(),
        address: app.user.activeAccount?.address,
        threadId: thread.id,
        reactionId: reactedId as number,
      }).catch((e) => {
        if (e instanceof SessionKeyError) {
          return;
        }
        console.error(e?.responseJSON?.error || e?.message);
      });
    } else {
      createThreadReaction({
        chainId: app.activeChainId(),
        address: activeAddress,
        threadId: thread.id,
        reactionType: 'like',
      }).catch((e) => {
        if (e instanceof SessionKeyError) {
          return;
        }
        console.error(e?.responseJSON?.error || e?.message);
      });
    }
  };

  return (
    <>
      {size === 'small' ? (
        <CWUpvoteSmall
          voteCount={reactors.length}
          disabled={isUserForbidden || disabled}
          threadArchived={!!thread.archivedAt}
          selected={hasReacted}
          onMouseEnter={() => undefined}
          onClick={handleVoteClick}
          tooltipContent={getDisplayedReactorsForPopup({
            reactors: reactors,
          })}
        />
      ) : disabled ? (
        <TooltipWrapper disabled={disabled} text="Join community to upvote">
          <CWUpvote
            onClick={handleVoteClick}
            voteCount={reactors.length}
            disabled={disabled}
            active={hasReacted}
          />
        </TooltipWrapper>
      ) : (
        <CWTooltip
          content={
            reactors.length > 0
              ? getDisplayedReactorsForPopup({
                  reactors,
                })
              : null
          }
          renderTrigger={(handleInteraction) => (
            <CWUpvote
              onClick={handleVoteClick}
              voteCount={reactors.length}
              disabled={disabled}
              active={hasReacted}
              onMouseEnter={handleInteraction}
              onMouseLeave={handleInteraction}
            />
          )}
        />
      )}
      <Modal
        content={<LoginModal onModalClose={() => setIsModalOpen(false)} />}
        isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
      {RevalidationModal}
    </>
  );
};

import { SessionKeyError } from 'controllers/server/sessions';
import type Thread from 'models/Thread';
import React, { useState } from 'react';
import app from 'state';
import {
  useCreateThreadReactionMutation,
  useDeleteThreadReactionMutation,
} from 'state/api/threads';
import { getDisplayedReactorsForPopup } from 'views/components/ReactionButton/helpers';
import { isWindowMediumSmallInclusive } from 'views/components/component_kit/helpers';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import CWPopover, {
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';
import CWUpvoteSmall from 'views/components/component_kit/new_designs/CWUpvoteSmall';
import { TooltipWrapper } from 'views/components/component_kit/new_designs/cw_thread_action';
import { CWUpvote } from 'views/components/component_kit/new_designs/cw_upvote';
import { useSessionRevalidationModal } from 'views/modals/SessionRevalidationModal';
import { LoginModal } from '../../../../../modals/login_modal';
import { ReactionButtonSkeleton } from './ReactionButtonSkeleton';

type ReactionButtonProps = {
  thread: Thread;
  size: 'small' | 'big';
  showSkeleton?: boolean;
  disabled: boolean;
  tooltipText?: string;
};

export const ReactionButton = ({
  thread,
  size,
  disabled,
  showSkeleton,
  tooltipText,
}: ReactionButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const reactors = thread?.associatedReactions?.map((t) => t.address);
  const activeAddress = app.user.activeAccount?.address;
  const thisUserReaction = thread?.associatedReactions?.filter(
    (r) => r.address === activeAddress,
  );
  const hasReacted = thisUserReaction?.length !== 0;
  const reactedId =
    thisUserReaction?.length === 0 ? -1 : thisUserReaction?.[0]?.id;
  const popoverProps = usePopover();

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
        console.error(e.response.data.error || e?.message);
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
        console.error(e.response.data.error || e?.message);
      });
    }
  };

  return (
    <>
      {size === 'small' ? (
        <CWUpvoteSmall
          voteCount={thread.reactionWeightsSum}
          disabled={disabled}
          isThreadArchived={!!thread.archivedAt}
          selected={hasReacted}
          onClick={handleVoteClick}
          popoverContent={getDisplayedReactorsForPopup({
            reactors,
          })}
          tooltipText={tooltipText}
        />
      ) : tooltipText ? (
        <TooltipWrapper disabled={disabled} text={tooltipText}>
          <CWUpvote
            onClick={handleVoteClick}
            voteCount={thread.reactionWeightsSum}
            disabled={disabled}
            active={hasReacted}
          />
        </TooltipWrapper>
      ) : (
        <div
          onMouseEnter={popoverProps.handleInteraction}
          onMouseLeave={popoverProps.handleInteraction}
        >
          <CWUpvote
            onClick={handleVoteClick}
            voteCount={thread.reactionWeightsSum || reactors.length}
            disabled={disabled}
            active={hasReacted}
          />

          {reactors.length > 0 && (
            <CWPopover
              body={getDisplayedReactorsForPopup({
                reactors,
              })}
              {...popoverProps}
            />
          )}
        </div>
      )}
      <CWModal
        content={<LoginModal onModalClose={() => setIsModalOpen(false)} />}
        isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
      {RevalidationModal}
    </>
  );
};

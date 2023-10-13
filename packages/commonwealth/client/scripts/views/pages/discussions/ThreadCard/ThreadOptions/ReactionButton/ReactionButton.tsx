import { SessionKeyError } from 'controllers/server/sessions';
import type Thread from 'models/Thread';
import React, { useState } from 'react';
import app from 'state';
import {
  useCreateThreadReactionMutation,
  useDeleteThreadReactionMutation,
} from 'state/api/threads';
import Permissions from 'utils/Permissions';
import { Modal } from 'views/components/component_kit/cw_modal';
import { CWTooltip } from 'views/components/component_kit/cw_popover/cw_tooltip';
import { isWindowMediumSmallInclusive } from 'views/components/component_kit/helpers';
import { TooltipWrapper } from 'views/components/component_kit/new_designs/cw_thread_action';
import { CWUpvote } from 'views/components/component_kit/new_designs/cw_upvote';
import CWUpvoteSmall from 'views/components/component_kit/new_designs/CWUpvoteSmall';
import { getDisplayedReactorsForPopup } from 'views/components/ReactionButton/helpers';
import { useSessionRevalidationModal } from 'views/modals/SessionRevalidationModal';
import { updateActiveAddresses } from '../../../../../../controllers/app/login';
import { selectChain } from '../../../../../../helpers/chain';
import { LoginModal } from '../../../../../modals/login_modal';
import { ReactionButtonSkeleton } from './ReactionButtonSkeleton';

type ReactionButtonProps = {
  thread: Thread;
  size: 'small' | 'big';
  showSkeleton?: boolean;
  disabled: boolean;
  chain?: string; // If this reaction button is not in a community, pass this in
};

export const ReactionButton = ({
  thread,
  size,
  disabled,
  showSkeleton,
  chain,
}: ReactionButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const chainId = chain ?? app.activeChainId();
  const reactors = thread?.associatedReactions?.map((t) => t.address);
  const userAddressForChain = app.user.addresses.find(
    (a) => a.chain.id === chainId
  ).address;
  const thisUserReaction = thread?.associatedReactions?.filter(
    (r) => r.address === userAddressForChain
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
    chainId,
    threadId: thread.id,
  });
  const {
    mutateAsync: deleteThreadReaction,
    isLoading: isDeletingReaction,
    error: deleteThreadReactionError,
    reset: resetDeleteThreadReactionMutation,
  } = useDeleteThreadReactionMutation({
    chainId,
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
  const isUserForbidden = !isAdmin && app.chain?.isGatedTopic(thread.topic?.id);

  const handleVoteClick = async (event) => {
    event.stopPropagation();
    event.preventDefault();

    // If this button was clicked, and we are not in a community, update the activeAddress
    let activeAddress = app.user.activeAccount?.address;

    if (!activeAddress) {
      await selectChain(app.config.chains.getById(chainId));
      await updateActiveAddresses({ chainId, shouldRedraw: false });
      activeAddress = app.user.activeAccount?.address;
    }

    if (isLoading || disabled) return;

    if (!app.isLoggedIn() || !activeAddress) {
      setIsModalOpen(true);
      return;
    }
    if (hasReacted) {
      deleteThreadReaction({
        chainId,
        address: activeAddress,
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
        chainId,
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
          selected={hasReacted}
          onMouseEnter={() => undefined}
          onClick={handleVoteClick}
          tooltipContent={getDisplayedReactorsForPopup({
            reactors: reactors,
            chainId,
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
                  chainId,
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

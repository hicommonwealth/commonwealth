import React from 'react';

import { redraw} from

 'mithrilInterop';

import 'components/reaction_button/thread_preview_reaction_button.scss';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import type { ChainInfo, Thread } from 'models';

import app from 'state';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import {
  fetchReactionsByPost,
  getDisplayedReactorsForPopup,
  onReactionClick,
} from './helpers';
import { CWTooltip } from '../component_kit/cw_popover/cw_tooltip';
import type { AnchorType } from '../component_kit/cw_popover/cw_popover';
import { Modal } from '../component_kit/cw_modal';
import { LoginModal } from '../../modals/login_modal';
import { isWindowMediumSmallInclusive } from '../component_kit/helpers';

type ThreadPreviewReactionButtonProps = {
  thread: Thread;
};

export const ThreadPreviewReactionButton = (
  props: ThreadPreviewReactionButtonProps
) => {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [reactors, setReactors] = React.useState<Array<any>>([]);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

  const { thread } = props;
  const reactionCounts = app.reactionCounts.store.getByPost(thread);
  const { likes = 0, hasReacted } = reactionCounts || {};

  // token balance check if needed
  const isAdmin =
    app.user.isSiteAdmin ||
    app.roles.isAdminOfEntity({ chain: app.activeChainId() });

  let topicName = '';

  if (thread.topic && app.topics) {
    topicName = thread.topic.name;
  }

  setIsLoading(
    isLoading || (!isAdmin && TopicGateCheck.isGatedTopic(topicName))
  );

  const activeAddress = app.user.activeAccount?.address;

  const dislike = async (userAddress: string) => {
    const reaction = (await fetchReactionsByPost(thread)).find((r) => {
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
        setIsLoading(false);
        redraw();
      });
  };

  const like = (chain: ChainInfo, chainId: string, userAddress: string) => {
    setIsLoading(true);

    app.reactionCounts.create(userAddress, thread, 'like', chainId).then(() => {
      setReactors([
        ...reactors,
        {
          Address: { address: userAddress, chain },
        },
      ]);

      setIsLoading(false);

      redraw();
    });
  };

  const ReactionButtonComponent = (buttonProps: {
    handleInteraction?: (e: React.MouseEvent<AnchorType>) => void;
  }) => {
    return (
      <React.Fragment>
        <Modal
          content={<LoginModal onModalClose={() => setIsModalOpen(false)} />}
          isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
          onClose={() => setIsModalOpen(false)}
          open={isModalOpen}
        />
        <div
          onMouseEnter={async (e) => {
            setReactors(await fetchReactionsByPost(thread));
            buttonProps.handleInteraction(e);
          }}
          onMouseLeave={buttonProps.handleInteraction}
          onClick={async (e) => {
            if (!app.isLoggedIn() || !app.user.activeAccount) {
              setIsModalOpen(true);
            } else {
              onReactionClick(e, hasReacted, dislike, like);
            }
          }}
          className={`ThreadPreviewReactionButton${
            isLoading ? ' disabled' : ''
          }${hasReacted ? ' has-reacted' : ''}`}
        >
          <CWIcon
            iconName={hasReacted ? 'heartFilled' : 'heartEmpty'}
            iconSize="small"
          />
          <div className="reactions-count">{likes}</div>
        </div>
      </React.Fragment>
    );
  };

  return likes > 0 ? (
    <CWTooltip
      content={
        <div className="reaction-button-tooltip-contents">
          {getDisplayedReactorsForPopup({
            likes,
            reactors: reactors,
          })}
        </div>
      }
      renderTrigger={(handleInteraction) => (
        <ReactionButtonComponent handleInteraction={handleInteraction} />
      )}
    />
  ) : (
    <ReactionButtonComponent />
  );
};

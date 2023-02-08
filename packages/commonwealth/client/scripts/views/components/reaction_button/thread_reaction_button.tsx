import React from 'react';

import { redraw} from

 'mithrilInterop';

import 'components/reaction_button/comment_reaction_button.scss';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import type { ChainInfo } from 'models';
import { Thread } from 'models';

import app from 'state';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { CWTooltip } from '../component_kit/cw_popover/cw_tooltip';
import { CWText } from '../component_kit/cw_text';
import {
  getClasses,
  isWindowMediumSmallInclusive,
} from '../component_kit/helpers';
import {
  fetchReactionsByPost,
  getDisplayedReactorsForPopup,
  onReactionClick,
} from './helpers';
import { LoginModal } from '../../modals/login_modal';
import { Modal } from '../component_kit/cw_modal';

type ThreadReactionButtonProps = {
  thread: Thread;
};

export const ThreadReactionButton = (props: ThreadReactionButtonProps) => {
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

  if (thread instanceof Thread && thread.topic && app.topics) {
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

  return (
    <React.Fragment>
      <Modal
        content={<LoginModal onModalClose={() => setIsModalOpen(false)} />}
        isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
      <div
        className={getClasses<{ disabled?: boolean }>(
          { disabled: isLoading },
          'CommentReactionButton'
        )}
        onMouseEnter={async () => {
          setReactors(await fetchReactionsByPost(thread));
        }}
      >
        <CWIconButton
          iconName="upvote"
          iconSize="small"
          selected={hasReacted}
          onClick={async (e) => {
            if (!app.isLoggedIn() || !app.user.activeAccount) {
              setIsModalOpen(true);
            } else {
              onReactionClick(e, hasReacted, dislike, like);
            }
          }}
        />
        {likes > 0 ? (
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
              <CWText
                onMouseEnter={handleInteraction}
                onMouseLeave={handleInteraction}
                className="menu-buttons-text"
                type="caption"
                fontWeight="medium"
              >
                {likes}
              </CWText>
            )}
          />
        ) : (
          <CWText
            className="menu-buttons-text"
            type="caption"
            fontWeight="medium"
          >
            {likes}
          </CWText>
        )}
      </div>
    </React.Fragment>
  );
};

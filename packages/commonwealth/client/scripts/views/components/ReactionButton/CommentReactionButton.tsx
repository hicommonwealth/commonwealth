import React, { useState } from 'react';

import { redraw } from 'mithrilInterop';

import 'components/ReactionButton/CommentReactionButton.scss';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';

import app from 'state';
import type ChainInfo from '../../../models/ChainInfo';
import type Comment from '../../../models/Comment';
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

type CommentReactionButtonProps = {
  comment: Comment<any>;
};

export const CommentReactionButton = ({
  comment,
}: CommentReactionButtonProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [reactors, setReactors] = useState<Array<any>>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const reactionCounts = app.reactionCounts.store.getByPost(comment);
  const { likes = 0, hasReacted } = reactionCounts || {};

  // token balance check if needed
  const isAdmin =
    app.user.isSiteAdmin ||
    app.roles.isAdminOfEntity({ chain: app.activeChainId() });

  const parentThread = app.threads.getById(comment.threadId);

  const topicName = parentThread?.topic?.name;

  const isUserForbidden = !isAdmin && TopicGateCheck.isGatedTopic(topicName);

  const activeAddress = app.user.activeAccount?.address;

  const dislike = async (userAddress: string) => {
    const reaction = (await fetchReactionsByPost(comment)).find((r) => {
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

    app.reactionCounts
      .create(userAddress, comment, 'like', chainId)
      .then(() => {
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
    <>
      <Modal
        content={<LoginModal onModalClose={() => setIsModalOpen(false)} />}
        isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
      <div
        className={getClasses<{ disabled?: boolean }>(
          { disabled: isLoading || isUserForbidden },
          'CommentReactionButton'
        )}
        onMouseEnter={async () => {
          setReactors(await fetchReactionsByPost(comment));
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
                  reactors: reactors.map((r) => r.Address.address),
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
    </>
  );
};

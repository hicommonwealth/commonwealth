import 'components/reaction_button/comment_reaction_button.scss';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';

import type { ChainInfo, Thread } from 'models';
import React, { useEffect, useState } from 'react';

import app from 'state';
import { LoginModal } from '../../modals/login_modal';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { Modal } from '../component_kit/cw_modal';
import { CWTooltip } from '../component_kit/cw_popover/cw_tooltip';
import { CWText } from '../component_kit/cw_text';
import { getClasses, isWindowMediumSmallInclusive } from '../component_kit/helpers';
import { getDisplayedReactorsForPopup, onReactionClick } from './helpers';

export const useThreadReactionButton = (thread: Thread, setReactors) => {
  const activeAddress = app.user.activeAccount?.address;

  const [isLoading, setIsLoading] = useState(false);

  const thisUserReaction = thread.associatedReactions.filter(r => r.address === activeAddress);
  const [hasReacted, setHasReacted] = useState(thisUserReaction.length !== 0);
  const [reactedId, setReactedId] = useState(thisUserReaction.length === 0 ? -1 : thisUserReaction[0].id);

  useEffect(() => {
    const fetch = () => {
      if (app.user.activeAccount && thread.associatedReactions.filter((r) => r.address === activeAddress).length > 0) {
        setHasReacted(true);
      } else {
        setHasReacted(false);
      }

      setReactors(thread.associatedReactions.map(t => t.address));
    };

    fetch();
  }, []);

  // token balance check if needed
  const isAdmin =
    app.user.isSiteAdmin ||
    app.roles.isAdminOfEntity({ chain: app.activeChainId() });

  let topicName = '';

  if (thread.topic && app.topics) {
    topicName = thread.topic.name;
  }

  const isUserForbidden = !isAdmin && TopicGateCheck.isGatedTopic(topicName);

  const dislike = async () => {
    if (reactedId === -1) {
      return;
    }

    setIsLoading(true);

    app.threadReactions.deleteOnThread(thread, reactedId).then(() => {
      setReactors(oldReactors => oldReactors.filter((r) => r !== activeAddress));
      setReactedId(-1);
      setHasReacted(false);
      setIsLoading(false);
    });
  };

  const like = async (
    chain: ChainInfo,
    chainId: string,
    userAddress: string
  ) => {
    setIsLoading(true);
    app.threadReactions
      .createOnThread(userAddress, thread, 'like')
      .then((reaction) => {
        setReactedId(reaction.id);
        setReactors(oldReactors => [...oldReactors, activeAddress]);
        setHasReacted(true);
        setIsLoading(false);
      });
  };

  return {
    dislike,
    hasReacted,
    isLoading,
    isUserForbidden,
    like,
    setIsLoading,
  };
};

type ThreadReactionButtonProps = {
  thread: Thread;
};

export const ThreadReactionPreviewButtonSmall = ({ thread }: ThreadReactionButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [reactors, setReactors] = useState([]);

  const {
    dislike,
    hasReacted,
    isLoading,
    isUserForbidden,
    like
  } = useThreadReactionButton(thread, setReactors);

  return (
    <>
      <div
        className={getClasses<{ disabled?: boolean }>(
          { disabled: isLoading || isUserForbidden },
          'CommentReactionButton'
        )}
        onMouseEnter={async () => {
          if (reactors.length === 0) {
            setReactors(thread.associatedReactions.map((addr) => addr));
          }
        }}
      >
        <CWIconButton
          iconName="upvote"
          iconSize="small"
          selected={hasReacted}
          onClick={async (e) => {
            e.stopPropagation();
            if (!app.isLoggedIn() || !app.user.activeAccount) {
              setIsModalOpen(true);
            } else {
              onReactionClick(e, hasReacted, dislike, like);
            }
          }}
        />
        {reactors.length > 0 ? (
          <CWTooltip
            content={
              <div className="reaction-button-tooltip-contents">
                {getDisplayedReactorsForPopup({
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
                {reactors.length}
              </CWText>
            )}
          />
        ) : (
          <CWText
            className="menu-buttons-text"
            type="caption"
            fontWeight="medium"
          >
            {reactors.length}
          </CWText>
        )}
      </div>
      <Modal
        content={<LoginModal onModalClose={() => setIsModalOpen(false)}/>}
        isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
    </>
  );
};

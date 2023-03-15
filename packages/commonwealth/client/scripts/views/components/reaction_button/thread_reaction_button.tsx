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
import { getClasses, isWindowMediumSmallInclusive, } from '../component_kit/helpers';
import { fetchReactionsByPost, getDisplayedReactorsForPopup, onReactionClick, } from './helpers';

export const useThreadReactionButton = (thread: Thread) => {
  const [isLoading, setIsLoading] = useState(false);
  const [reactors, setReactors] = useState<Array<any>>([]);
  const [likes, setLikes] = useState(0);
  const [hasReacted, setHasReacted] = useState(false);
  const [reactionCounts, setReactionCounts] = useState<number>(0);

  useEffect(() => {
    const fetch = () => {
      if (app.user.activeAccount && thread.associatedReactions.filter((r) => r.address === activeAddress).length > 0) {
        setHasReacted(true);
      } else {
        setHasReacted(false);
      }

      setReactionCounts(thread.associatedReactions.length);
    };

    fetch();
  }, [hasReacted, thread]);

  // token balance check if needed
  const isAdmin =
    app.user.isSiteAdmin ||
    app.roles.isAdminOfEntity({ chain: app.activeChainId() });

  let topicName = '';

  if (thread.topic && app.topics) {
    topicName = thread.topic.name;
  }

  const isUserForbidden = !isAdmin && TopicGateCheck.isGatedTopic(topicName);

  const activeAddress = app.user.activeAccount?.address;

  const dislike = async (userAddress: string) => {
    setIsLoading(true);

    app.threadReactions.deleteOnThread(userAddress, thread).then(() => {
      thread.associatedReactions = thread.associatedReactions.filter(
        (r) => r.address !== activeAddress
      );
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
        thread.associatedReactions.push({
          id: reaction.id,
          type: reaction.reaction,
          address: activeAddress,
        });
        setIsLoading(false);
      });
  };

  return {
    dislike,
    hasReacted,
    isLoading,
    isUserForbidden,
    like,
    likes,
    reactors,
    setIsLoading,
    setReactors,
  };
};

type ThreadReactionButtonProps = {
  thread: Thread;
};

export const ThreadReactionButton = ({ thread }: ThreadReactionButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const {
    dislike,
    hasReacted,
    isLoading,
    isUserForbidden,
    like,
    likes,
    reactors,
    setReactors,
  } = useThreadReactionButton(thread);

  return (
    <>
      <div
        className={getClasses<{ disabled?: boolean }>(
          { disabled: isLoading || isUserForbidden },
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
                  likes: thread.associatedReactions.length,
                  reactors: app.threadReactions.getByThreadId(thread.id),
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
      <Modal
        content={<LoginModal onModalClose={() => setIsModalOpen(false)}/>}
        isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
    </>
  );
};

import React, { useState } from 'react';

import 'components/reaction_button/thread_preview_reaction_button.scss';

import type { Thread } from 'models';

import app from 'state';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import {
  fetchReactionsByPost,
  getDisplayedReactorsForPopup,
  onReactionClick,
} from './helpers';
import { CWTooltip } from '../component_kit/cw_popover/cw_tooltip';
import { Modal } from '../component_kit/cw_modal';
import { LoginModal } from '../../modals/login_modal';
import { isWindowMediumSmallInclusive } from '../component_kit/helpers';
import { useThreadReactionButton } from './thread_reaction_button';

type ThreadPreviewReactionButtonProps = {
  thread: Thread;
};

export const ThreadPreviewReactionButton = ({
  thread,
}: ThreadPreviewReactionButtonProps) => {
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
        onMouseEnter={async () => {
          setReactors(await fetchReactionsByPost(thread));
        }}
        onClick={async (e) => {
          if (!app.isLoggedIn() || !app.user.activeAccount) {
            setIsModalOpen(true);
          } else {
            onReactionClick(e, hasReacted, dislike, like);
          }
        }}
        className={`ThreadPreviewReactionButton${
          isLoading || isUserForbidden ? ' disabled' : ''
        }${hasReacted ? ' has-reacted' : ''}`}
      >
        {likes > 0 ? (
          <CWTooltip
            content={
              <div className="reaction-button-tooltip-contents">
                {getDisplayedReactorsForPopup({
                  likes,
                  reactors,
                })}
              </div>
            }
            renderTrigger={(handleInteraction) => (
              <div
                onMouseEnter={handleInteraction}
                onMouseLeave={handleInteraction}
              >
                <div className="reactions-container">
                  <CWIcon
                    iconName={hasReacted ? 'heartFilled' : 'heartEmpty'}
                    iconSize="small"
                  />
                  <div className="reactions-count">{likes}</div>
                </div>
              </div>
            )}
          />
        ) : (
          <div className="reactions-container">
            <CWIcon
              iconName={hasReacted ? 'heartFilled' : 'heartEmpty'}
              iconSize="small"
            />
            <div className="reactions-count">{likes}</div>
          </div>
        )}
      </div>
      <Modal
        content={<LoginModal onModalClose={() => setIsModalOpen(false)} />}
        isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
    </>
  );
};

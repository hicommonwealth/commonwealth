import React, { useState } from 'react';

import 'components/ReactionButton/ThreadPreviewReactionButton.scss';

import type Thread from '../../../models/Thread';
import { LoginModal } from '../../modals/login_modal';

import app from 'state';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { getDisplayedReactorsForPopup, onReactionClick } from './helpers';
import { CWTooltip } from '../component_kit/cw_popover/cw_tooltip';
import { Modal } from '../component_kit/cw_modal';
import { isWindowMediumSmallInclusive } from '../component_kit/helpers';
import { useReactionButton } from './useReactionButton';

type ThreadPreviewReactionButtonProps = {
  thread: Thread;
};

export const ThreadPreviewReactionButtonBig = ({
  thread,
}: ThreadPreviewReactionButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [reactors, setReactors] = useState<Array<any>>([]);

  const { dislike, hasReacted, isLoading, isUserForbidden, like } =
    useReactionButton(thread, setReactors);

  return (
    <>
      <div
        onMouseEnter={async () => {
          if (reactors.length === 0) {
            setReactors(thread.associatedReactions.map((a) => a.address));
          }
        }}
        onClick={async (e) => {
          e.stopPropagation();
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
        {reactors.length > 0 ? (
          <CWTooltip
            content={
              <div className="reaction-button-tooltip-contents">
                {getDisplayedReactorsForPopup({
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
                    iconName='arrowFatUp'
                    iconSize="small"
                  />
                  <div className="reactions-count">{reactors.length}</div>
                </div>
              </div>
            )}
          />
        ) : (
          <div className="reactions-container">
            <CWIcon
              iconName='arrowFatUp'
              iconSize="small"
            />
            <div className="reactions-count">{reactors.length}</div>
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

import 'components/ReactionButton/CommentReactionButton.scss';

import type Thread from '../../../models/Thread';
import React, { useState } from 'react';

import app from 'state';
import { LoginModal } from '../../modals/login_modal';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { Modal } from '../component_kit/cw_modal';
import { CWTooltip } from '../component_kit/cw_popover/cw_tooltip';
import { CWText } from '../component_kit/cw_text';
import {
  getClasses,
  isWindowMediumSmallInclusive,
} from '../component_kit/helpers';
import { getDisplayedReactorsForPopup, onReactionClick } from './helpers';
import { useReactionButton } from './useReactionButton';

type ThreadReactionButtonProps = {
  thread: Thread;
};

export const ThreadReactionPreviewButtonSmall = ({
  thread,
}: ThreadReactionButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [reactors, setReactors] = useState([]);

  const { dislike, hasReacted, isLoading, isUserForbidden, like } =
    useReactionButton(thread, setReactors);

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
          iconName={hasReacted ? 'arrowFatUpBlue500' : (isLoading || isUserForbidden ? 'arrowFatUpNeutral' : 'arrowFatUp')}
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
        content={<LoginModal onModalClose={() => setIsModalOpen(false)} />}
        isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
    </>
  );
};

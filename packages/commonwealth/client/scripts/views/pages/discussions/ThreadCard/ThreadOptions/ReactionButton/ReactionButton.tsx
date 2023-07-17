import React, { useState } from 'react';
import app from 'state';
import type Thread from '../../../../../../models/Thread';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { Modal } from 'views/components/component_kit/cw_modal';
import { CWTooltip } from 'views/components/component_kit/cw_popover/cw_tooltip';
import { CWText } from 'views/components/component_kit/cw_text';
import {
  getClasses,
  isWindowMediumSmallInclusive,
} from 'views/components/component_kit/helpers';
import {
  getDisplayedReactorsForPopup,
  onReactionClick,
} from 'views/components/ReactionButton/helpers';
import { LoginModal } from '../../../../../modals/login_modal';
import './ReactionButton.scss';
import { useReactionButton } from './useReactionButton';

type ReactionButtonProps = {
  thread: Thread;
  size: 'small' | 'big';
};

export const ReactionButton = ({ thread, size }: ReactionButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [reactors, setReactors] = useState<Array<any>>([]);

  const { dislike, hasReacted, isLoading, isUserForbidden, like } =
    useReactionButton(thread, setReactors);

  return (
    <>
      {size === 'small' ? (
        <button
          className={getClasses<{ disabled?: boolean }>(
            { disabled: isLoading || isUserForbidden },
            `CommentReactionButton ${hasReacted ? ' has-reacted' : ''}`
          )}
          onMouseEnter={async () => {
            if (reactors.length === 0) {
              setReactors(thread.associatedReactions.map((addr) => addr));
            }
          }}
          onClick={async (e) => {
            e.stopPropagation();
            e.preventDefault();
            if (!app.isLoggedIn() || !app.user.activeAccount) {
              setIsModalOpen(true);
            } else {
              onReactionClick(e, hasReacted, dislike, like);
            }
          }}
        >
          <CWIcon
            iconName="upvote"
            {...(hasReacted && { weight: 'fill' })}
            iconSize="small"
            selected={hasReacted}
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
                  className={`menu-buttons-text ${
                    hasReacted ? ' has-reacted' : ''
                  }`}
                  type="caption"
                  fontWeight="medium"
                >
                  {reactors.length}
                </CWText>
              )}
            />
          ) : (
            <CWText
              className={`menu-buttons-text ${
                hasReacted ? ' has-reacted' : ''
              }`}
              type="caption"
              fontWeight="medium"
            >
              {reactors.length}
            </CWText>
          )}
        </button>
      ) : (
        <button
          onMouseEnter={async () => {
            if (reactors.length === 0) {
              setReactors(thread.associatedReactions.map((a) => a.address));
            }
          }}
          onClick={async (e) => {
            e.stopPropagation();
            e.preventDefault();

            if (!app.isLoggedIn() || !app.user.activeAccount) {
              setIsModalOpen(true);
            } else {
              onReactionClick(e, hasReacted, dislike, like);
            }
          }}
          className={`ThreadReactionButton ${
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
                      iconName="upvote"
                      iconSize="small"
                      {...(hasReacted && { weight: 'fill' })}
                    />
                    <div
                      className={`reactions-count ${
                        hasReacted ? ' has-reacted' : ''
                      }`}
                    >
                      {reactors.length}
                    </div>
                  </div>
                </div>
              )}
            />
          ) : (
            <div className="reactions-container">
              <CWIcon iconName="upvote" iconSize="small" />
              <div
                className={`reactions-count ${
                  hasReacted ? ' has-reacted' : ''
                }`}
              >
                {reactors.length}
              </div>
            </div>
          )}
        </button>
      )}
      <Modal
        content={<LoginModal onModalClose={() => setIsModalOpen(false)} />}
        isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
    </>
  );
};

import { NotificationCategories } from 'common-common/src/types';
import useForceRerender from 'hooks/useForceRerender';
import { toNumber } from 'lodash';
import Thread from 'models/Thread';
import React, { useState } from 'react';

import app from 'state';
import useUserActiveAccount from '../../../../hooks/useUserActiveAccount';
import useUserLoggedIn from '../../../../hooks/useUserLoggedIn';
import type NotificationSubscription from '../../../../models/NotificationSubscription';
import { CreateComment } from '../../../components/Comments/CreateComment';
import type { ProfileWithAddress } from '../../../components/component_kit/cw_avatar_group';
import { CWAvatarGroup } from '../../../components/component_kit/cw_avatar_group';
import { CWIcon } from '../../../components/component_kit/cw_icons/cw_icon';
import { Modal } from '../../../components/component_kit/cw_modal';
import { PopoverMenu } from '../../../components/component_kit/cw_popover/cw_popover_menu';
import { CWText } from '../../../components/component_kit/cw_text';
import { isWindowMediumSmallInclusive } from '../../../components/component_kit/helpers';
import { LoginModal } from '../../../modals/login_modal';
import { ReactionButton } from '../../discussions/ThreadCard/ThreadOptions/ReactionButton/index';
import { subscribeToThread } from '../helpers';

import './UserDashboardRowBottom.scss';

type UserDashboardRowBottomProps = {
  commentCount: string;
  setCommentCount;
  threadId: string;
  chainId: string;
  commentId?: string;
  commenters: ProfileWithAddress[];
  thread?: Thread;
  comment?: Comment<any>;
};

export const UserDashboardRowBottom = (props: UserDashboardRowBottomProps) => {
  const {
    threadId,
    commentCount,
    setCommentCount,
    commentId,
    chainId,
    commenters,
    thread,
    comment,
  } = props;
  const forceRerender = useForceRerender();
  const { isLoggedIn } = useUserLoggedIn();
  const { activeAccount: hasJoinedCommunity } = useUserActiveAccount();
  const [isReplying, setIsReplying] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // console log props with object destructuring
  // console.log({
  //   threadId,
  //   commentCount,
  //   commentId,
  //   chainId,
  //   commenters,
  //   thread,
  //   comment,
  // });

  const handleIsReplying = () => {
    setIsReplying(!isReplying);
  };

  const updatedCommentsCallback = () => {
    setCommentCount(parseInt(commentCount) + 1);
    forceRerender();
  };

  const setSubscription = async (
    subThreadId: string,
    bothActive: boolean,
    commentSubscription: NotificationSubscription,
    reactionSubscription: NotificationSubscription
  ) => {
    await subscribeToThread(
      subThreadId,
      bothActive,
      commentSubscription,
      reactionSubscription
    );
    forceRerender();
  };

  const adjustedId = `discussion_${threadId}`;

  const commentSubscription = app.user.notifications.subscriptions.find(
    (v) =>
      v.objectId === adjustedId &&
      v.category === NotificationCategories.NewComment
  );

  const reactionSubscription = app.user.notifications.subscriptions.find(
    (v) =>
      v.objectId === adjustedId &&
      v.category === NotificationCategories.NewReaction
  );

  const bothActive =
    commentSubscription?.isActive && reactionSubscription?.isActive;

  const domain = document.location.origin;
  return (
    <div className="UserDashboardRowBottom">
      <div className="top-row">
        <div className="activity">
          {thread && (
            <ReactionButton
              thread={thread}
              size="small"
              disabled={!hasJoinedCommunity}
            />
          )}
          <button
            className="thread-option-btn"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (!isLoggedIn) {
                return setIsLoginModalOpen(true);
              }
              if (thread) handleIsReplying();
            }}
          >
            <CWIcon iconName="comment" iconSize="small" />
            <CWText type="caption" className="text">
              {commentCount} {commentCount == 1 ? 'Comment' : 'Comments'}
            </CWText>
          </button>
          {commenters && (
            <div className="commenters">
              <CWAvatarGroup profiles={commenters} chainId={chainId} />
            </div>
          )}
        </div>
        <div
          className="actions"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <PopoverMenu
            menuItems={[
              {
                iconLeft: 'copy',
                label: 'Copy URL',
                onClick: async () => {
                  if (commentId) {
                    await navigator.clipboard.writeText(
                      `${domain}/${chainId}/discussion/${threadId}?comment=${commentId}`
                    );
                    return;
                  }
                  await navigator.clipboard.writeText(
                    `${domain}/${chainId}/discussion/${threadId}`
                  );
                },
              },
              {
                iconLeft: 'twitter',
                label: 'Share on Twitter',
                onClick: async () => {
                  if (commentId) {
                    await window.open(
                      `https://twitter.com/intent/tweet?text=${domain}/${chainId}/discussion/${threadId}
                        ?comment=${commentId}`
                    );
                    return;
                  }
                  await window.open(
                    `https://twitter.com/intent/tweet?text=${domain}/${chainId}/discussion/${threadId}`,
                    '_blank'
                  );
                },
              },
            ]}
            renderTrigger={(onClick) => (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onClick(e);
                }}
                className="thread-option-btn"
              >
                <CWIcon
                  color="black"
                  iconName="share"
                  iconSize="small"
                  weight="fill"
                />
                <CWText type="caption">Share</CWText>
              </button>
            )}
          />
          <button
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              threadId &&
                (await setSubscription(
                  threadId,
                  bothActive,
                  commentSubscription,
                  reactionSubscription
                ));
            }}
            className="thread-option-btn"
          >
            <CWIcon
              color="black"
              iconName={bothActive ? 'bellMuted' : 'bell'}
              iconSize="small"
            />
          </button>
        </div>
      </div>
      {isReplying && (
        <CreateComment
          handleIsReplying={handleIsReplying}
          parentCommentId={commentId ? toNumber(commentId) : null}
          rootThread={thread}
          updatedCommentsCallback={updatedCommentsCallback}
          canComment={!thread.readOnly}
        />
      )}
      {isLoginModalOpen && (
        <Modal
          content={
            <LoginModal onModalClose={() => setIsLoginModalOpen(false)} />
          }
          isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
          onClose={(e) => {
            e.stopPropagation();
            setIsLoginModalOpen(false);
          }}
          open={isLoginModalOpen}
        />
      )}
    </div>
  );
};

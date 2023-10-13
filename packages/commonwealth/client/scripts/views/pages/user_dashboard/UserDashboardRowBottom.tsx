import { NotificationCategories } from 'common-common/src/types';
import useForceRerender from 'hooks/useForceRerender';
import Thread from 'models/Thread';

import 'pages/user_dashboard/UserDashboardRowBottom.scss';
import React, { useState } from 'react';

import app from 'state';
import NotificationSubscription from '../../../models/NotificationSubscription';
import { CreateComment } from '../../components/Comments/CreateComment';
import type { ProfileWithAddress } from '../../components/component_kit/cw_avatar_group';
import { CWAvatarGroup } from '../../components/component_kit/cw_avatar_group';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { PopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWText } from '../../components/component_kit/cw_text';
import { ReactionButton } from '../discussions/ThreadCard/ThreadOptions/ReactionButton/index';
import { subscribeToThread } from './helpers';
import { UserDashboardRowBottomSkeleton } from './UserDashboardRowBottomSkeleton';

type UserDashboardRowBottomProps = {
  commentCount: number;
  threadId: string;
  chainId: string;
  commentId?: string;
  commenters: ProfileWithAddress[];
  showSkeleton?: boolean;
  thread?: Thread;
};

export const UserDashboardRowBottom = (props: UserDashboardRowBottomProps) => {
  const {
    threadId,
    commentCount,
    commentId,
    chainId,
    commenters,
    showSkeleton,
    thread,
  } = props;
  const forceRerender = useForceRerender();
  const [isReplying, setIsReplying] = useState(false);

  if (showSkeleton) {
    return <UserDashboardRowBottomSkeleton />;
  }

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

  const commentSubscription =
    app.user.notifications.findNotificationSubscription({
      categoryId: NotificationCategories.NewComment,
      options: { threadId: Number(threadId) },
    });

  const reactionSubscription =
    app.user.notifications.findNotificationSubscription({
      categoryId: NotificationCategories.NewReaction,
      options: { threadId: Number(threadId) },
    });

  const bothActive =
    commentSubscription?.isActive && reactionSubscription?.isActive;

  const domain = document.location.origin;

  const handleIsReplying = () => {
    setIsReplying(!isReplying);
  };

  return (
    <div className="UserDashboardRowBottom">
      <div className="top-row">
        <div
          className="activity"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {
            thread && (
              <ReactionButton
                thread={thread}
                size="small"
                disabled={false}
                showSkeleton={showSkeleton}
                chain={chainId}
              />
            ) /* Show on more than threads? */
          }
          <button
            className="thread-option-btn"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
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
                iconLeft: 'linkPhosphor',
                iconLeftSize: 'regular',
                label: 'Copy link',
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
                iconLeft: 'twitterOutline',
                iconLeftSize: 'regular',
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
              <CWIconButton
                iconName="share"
                iconSize="small"
                onClick={onClick}
              />
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
          parentCommentId={commentId ? parseInt(commentId) : null}
          rootThread={thread}
          updatedCommentsCallback={forceRerender}
          canComment={true}
        /> // user can comment because this thread is on his dashboard
      )}
    </div>
  );
};

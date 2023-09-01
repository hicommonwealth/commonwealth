import React, { useState } from 'react';

import { NotificationCategories } from 'common-common/src/types';

import './UserDashboardRowBottom.scss';

import app from 'state';
import { CWAvatarGroup } from '../../../components/component_kit/cw_avatar_group';
import type { ProfileWithAddress } from '../../../components/component_kit/cw_avatar_group';
import { CWIconButton } from '../../../components/component_kit/cw_icon_button';
import { CWIcon } from '../../../components/component_kit/cw_icons/cw_icon';
import { PopoverMenu } from '../../../components/component_kit/cw_popover/cw_popover_menu';
import { CWText } from '../../../components/component_kit/cw_text';
import { subscribeToThread } from '../helpers';
import type NotificationSubscription from '../../../../models/NotificationSubscription';
import useForceRerender from 'hooks/useForceRerender';
import Thread from 'models/Thread';
import { CreateComment } from '../../../components/Comments/CreateComment';
import { toNumber } from 'lodash';
import { UserDashboardRowBottomSkeleton } from '../UserDashboardRowBottomSkeleton';

type UserDashboardRowBottomProps = {
  commentCount: number;
  threadId: string;
  chainId: string;
  commentId?: string;
  commenters: ProfileWithAddress[];
  thread?: Thread;
  showSkeleton?: boolean;
};

export const UserDashboardRowBottom = (props: UserDashboardRowBottomProps) => {
  const {
    threadId,
    commentCount,
    commentId,
    chainId,
    commenters,
    thread,
    showSkeleton,
  } = props;
  const forceRerender = useForceRerender();
  const [isReplying, setIsReplying] = useState(false);

  if (showSkeleton) {
    return <UserDashboardRowBottomSkeleton />;
  }

  const handleIsReplying = () => {
    setIsReplying(!isReplying);
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

  return (
    <div className="UserDashboardRowBottom">
      <div className="comments">
        <div className="count">
          <button
            className="thread-option-btn"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (thread) handleIsReplying();
            }}
          >
            <CWIcon iconName="feedback" iconSize="small" className="icon" />
            <CWText type="caption" className="text">
              {commentCount} {commentCount == 1 ? 'Comment' : 'Comments'}
            </CWText>
          </button>
        </div>
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
              onClick: () => {
                setSubscription(
                  threadId,
                  bothActive,
                  commentSubscription,
                  reactionSubscription
                );
              },
              label: bothActive ? 'Unsubscribe' : 'Subscribe',
              iconLeft: bothActive ? 'unsubscribe' : 'bell',
            },
          ]}
          renderTrigger={(onClick) => (
            <CWIconButton
              iconName={bothActive ? 'unsubscribe' : 'bell'}
              iconSize="small"
              onClick={onClick}
            />
          )}
        />
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
            <CWIconButton iconName="share" iconSize="small" onClick={onClick} />
          )}
        />
      </div>
    </div>
  );
};

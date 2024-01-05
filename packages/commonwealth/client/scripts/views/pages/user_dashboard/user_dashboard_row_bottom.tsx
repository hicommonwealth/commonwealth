import React from 'react';

import { NotificationCategories } from '@hicommonwealth/core';

import 'pages/user_dashboard/user_dashboard_row_bottom.scss';

import useForceRerender from 'hooks/useForceRerender';
import app from 'state';
import { PopoverMenu } from 'views/components/component_kit/CWPopoverMenu';
import type NotificationSubscription from '../../../models/NotificationSubscription';
import type { ProfileWithAddress } from '../../components/component_kit/cw_avatar_group';
import { CWAvatarGroup } from '../../components/component_kit/cw_avatar_group';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
import { UserDashboardRowBottomSkeleton } from './UserDashboardRowBottomSkeleton';
import { subscribeToThread } from './helpers';

type UserDashboardRowBottomProps = {
  commentCount: number;
  threadId: string;
  communityId: string;
  commentId?: string;
  commenters: ProfileWithAddress[];
  showSkeleton?: boolean;
};

export const UserDashboardRowBottom = (props: UserDashboardRowBottomProps) => {
  const {
    threadId,
    commentCount,
    commentId,
    communityId,
    commenters,
    showSkeleton,
  } = props;
  const forceRerender = useForceRerender();

  if (showSkeleton) {
    return <UserDashboardRowBottomSkeleton />;
  }

  const setSubscription = async (
    subThreadId: string,
    bothActive: boolean,
    commentSubscription: NotificationSubscription,
    reactionSubscription: NotificationSubscription,
  ) => {
    await subscribeToThread(
      subThreadId,
      bothActive,
      commentSubscription,
      reactionSubscription,
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
          <CWIcon iconName="comment" iconSize="small" />
          <CWText type="caption" className="text">
            {commentCount} {commentCount == 1 ? 'Comment' : 'Comments'}
          </CWText>
        </div>
        <div>
          <CWAvatarGroup
            profiles={commenters}
            communityId={communityId}
            totalProfiles={commentCount}
          />
        </div>
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
                  reactionSubscription,
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
              iconLeft: 'linkPhosphor',
              iconLeftSize: 'regular',
              label: 'Copy link',
              onClick: async () => {
                if (commentId) {
                  await navigator.clipboard.writeText(
                    `${domain}/${communityId}/discussion/${threadId}?comment=${commentId}`,
                  );
                  return;
                }
                await navigator.clipboard.writeText(
                  `${domain}/${communityId}/discussion/${threadId}`,
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
                    `https://twitter.com/intent/tweet?text=${domain}/${communityId}/discussion/${threadId}
                      ?comment=${commentId}`,
                  );
                  return;
                }
                await window.open(
                  `https://twitter.com/intent/tweet?text=${domain}/${communityId}/discussion/${threadId}`,
                  '_blank',
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

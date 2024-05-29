import React from 'react';

import { NotificationCategories } from '@hicommonwealth/shared';

import 'pages/user_dashboard/user_dashboard_row_bottom.scss';

import useForceRerender from 'hooks/useForceRerender';
import app from 'state';
import type NotificationSubscription from '../../../models/NotificationSubscription';
import type { ProfileWithAddress } from '../../components/component_kit/cw_avatar_group';
import { CWAvatarGroup } from '../../components/component_kit/cw_avatar_group';
import { CWThreadAction } from '../../components/component_kit/new_designs/cw_thread_action';
import { SharePopover } from '../../components/share_popover';
import { UserDashboardRowBottomSkeleton } from './UserDashboardRowBottomSkeleton';
import { subscribeToThread } from './helpers';

type UserDashboardRowBottomProps = {
  commentCount: number;
  threadId: string;
  communityId: string;
  commenters: ProfileWithAddress[];
  showSkeleton?: boolean;
  discussionLink?: string;
  isLoggedIn?: boolean;
};

export const UserDashboardRowBottom = (props: UserDashboardRowBottomProps) => {
  const {
    threadId,
    commentCount,
    communityId,
    commenters,
    showSkeleton,
    discussionLink,
    isLoggedIn,
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

  return (
    <div className="UserDashboardRowBottom">
      <CWThreadAction label={`${commentCount}`} action="comment" hideToolTip />
      <CWAvatarGroup
        className="avatar-group"
        profiles={commenters}
        communityId={communityId}
        totalProfiles={commentCount}
      />
      <CWThreadAction
        action="subscribe"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isLoggedIn) return;
          setSubscription(
            threadId,
            bothActive,
            commentSubscription,
            reactionSubscription,
          );
        }}
        selected={bothActive}
        className="subscribe-btn"
      />
      <SharePopover
        // if share endpoint is present it will be used, else the current url will be used
        discussionLink={
          discussionLink.startsWith('/') ? discussionLink : `/${discussionLink}`
        }
      />
    </div>
  );
};

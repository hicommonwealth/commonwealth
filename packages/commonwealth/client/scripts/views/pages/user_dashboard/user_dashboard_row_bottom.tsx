import React from 'react';

import { NotificationCategories } from 'common-common/src/types';
import { ClassComponent} from

 'mithrilInterop';
import type { ResultNode } from 'mithrilInterop';

import 'pages/user_dashboard/user_dashboard_row_bottom.scss';

import app from 'state';
import { CWAvatarGroup } from '../../components/component_kit/cw_avatar_group';
import type { ProfileWithAddress } from '../../components/component_kit/cw_avatar_group';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { PopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWText } from '../../components/component_kit/cw_text';
import { subscribeToThread } from './helpers';

type UserDashboardRowBottomAttrs = {
  commentCount: number;
  threadId: string;
  chainId: string;
  commentId?: string;
  commenters: ProfileWithAddress[];
};

export class UserDashboardRowBottom extends ClassComponent<UserDashboardRowBottomAttrs> {
  view(vnode: ResultNode<UserDashboardRowBottomAttrs>) {
    const { threadId, commentCount, commentId, chainId, commenters } =
      vnode.attrs;

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
        <div className="comments">
          <div className="count">
            <CWIcon iconName="feedback" iconSize="small" className="icon" />
            <CWText type="caption" className="text">
              {commentCount} {commentCount == 1 ? 'Comment' : 'Comments'}
            </CWText>
          </div>
          <div>
            <CWAvatarGroup profiles={commenters} chainId={chainId} />
          </div>
        </div>
        <div className="actions" onClick={(e) => e.stopPropagation()}>
          <PopoverMenu
            menuItems={[
              {
                onClick: () => {
                  subscribeToThread(
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
              <CWIconButton
                iconName="share"
                iconSize="small"
                onClick={onClick}
              />
            )}
          />
        </div>
      </div>
    );
  }
}

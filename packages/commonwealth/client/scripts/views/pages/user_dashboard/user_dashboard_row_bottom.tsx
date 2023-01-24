/* @jsx m */

import ClassComponent from 'class_component';
import { NotificationCategories } from 'common-common/src/types';
import m from 'mithril';

import 'pages/user_dashboard/user_dashboard_row_bottom.scss';

import app from 'state';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWPopoverMenu } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { CWText } from '../../components/component_kit/cw_text';
import { subscribeToThread } from './helpers';

type UserDashboardRowBottomAttrs = {
  commentCount: number;
  threadId: string;
  chainId: string;
  commentId?: string;
};

export class UserDashboardRowBottom extends ClassComponent<UserDashboardRowBottomAttrs> {
  view(vnode: m.Vnode<UserDashboardRowBottomAttrs>) {
    const { threadId, commentCount, commentId, chainId } = vnode.attrs;

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
      <div class="UserDashboardRowBottom">
        <div class="comment-count">
          <CWIcon iconName="feedback" iconSize="small" className="icon" />
          <CWText type="caption" className="text">
            {commentCount} {commentCount == 1 ? 'Comment' : 'Comments'}
          </CWText>
        </div>
        <div className="actions" onclick={(e) => e.stopPropagation()}>
          <CWPopoverMenu
            menuItems={[
              {
                onclick: (e) => {
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
            trigger={
              <CWIconButton
                iconName={bothActive ? 'unsubscribe' : 'bell'}
                iconSize="small"
              />
            }
          />
          <CWPopoverMenu
            menuItems={[
              {
                iconLeft: 'copy',
                label: 'Copy URL',
                onclick: async () => {
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
                onclick: async () => {
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
            trigger={<CWIconButton iconName="share" iconSize="small" />}
          />
        </div>
      </div>
    );
  }
}

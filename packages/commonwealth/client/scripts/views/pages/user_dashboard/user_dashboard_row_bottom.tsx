/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import { Icons, MenuItem, PopoverMenu } from 'construct-ui';

import 'pages/user_dashboard/user_dashboard_row_bottom.scss';

import app from 'state';
import { NotificationCategories } from 'common-common/src/types';
import { subscribeToThread } from './helpers';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';

type UserDashboardRowBottomAttrs = {
  commentCount: number;
  likeCount: number;
  path: string;
  threadId: string;
  viewCount: number;
};

export class UserDashboardRowBottom extends ClassComponent<UserDashboardRowBottomAttrs> {
  view(vnode: m.Vnode<UserDashboardRowBottomAttrs>) {
    const { path, threadId, viewCount, likeCount, commentCount } = vnode.attrs;

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

    return (
      <div class="UserDashboardRowBottom">
        <div class="buttons-row">
          <CWButton
            label="Discuss"
            iconLeft="plus"
            buttonType="secondary-blue"
          />
          <CWButton
            label={bothActive ? 'Unsubscribe' : 'Subscribe'}
            iconLeft="bell"
            buttonType="secondary-blue"
            onclick={(e) => {
              e.stopPropagation();

              subscribeToThread(
                threadId,
                bothActive,
                commentSubscription,
                reactionSubscription
              );
            }}
          />
          <div
            onclick={(e) => {
              e.stopPropagation();
            }}
          >
            {m(PopoverMenu, {
              transitionDuration: 0,
              closeOnOutsideClick: true,
              closeOnContentClick: true,
              menuAttrs: { size: 'default' },
              content: [
                m(MenuItem, {
                  iconLeft: Icons.COPY,
                  label: 'Copy URL',
                  onclick: async () => {
                    await navigator.clipboard.writeText(path);
                  },
                }),
                m(MenuItem, {
                  iconLeft: Icons.TWITTER,
                  label: 'Share on Twitter',
                  onclick: async () => {
                    await window.open(
                      `https://twitter.com/intent/tweet?text=${path}`,
                      '_blank'
                    );
                  },
                }),
              ],
              trigger: (
                <CWButton
                  label="Share"
                  iconLeft="share"
                  buttonType="secondary-blue"
                />
              ),
            })}
          </div>
        </div>
        <div class="interaction-counts">
          {viewCount && viewCount > 0 && (
            <div class="icon-and-count">
              <CWIcon iconName="views" className="count-icon" />
              <CWText className="count-text">{viewCount}</CWText>
            </div>
          )}
          {likeCount && likeCount > 0 && (
            <div class="icon-and-count">
              <CWIcon iconName="heartFilled" className="count-icon" />
              <CWText className="count-text">{likeCount}</CWText>
            </div>
          )}
          {commentCount && commentCount > 0 && (
            <div class="icon-and-count">
              <CWIcon iconName="feedback" className="count-icon" />
              <CWText className="count-text">{commentCount}</CWText>
            </div>
          )}
        </div>
      </div>
    );
  }
}

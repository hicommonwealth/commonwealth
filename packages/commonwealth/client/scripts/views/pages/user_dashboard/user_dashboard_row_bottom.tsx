/* @jsx jsx */


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';
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
  view(vnode: ResultNode<UserDashboardRowBottomAttrs>) {
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
      <div className="UserDashboardRowBottom">
        <div className="buttons-row">
          <CWButton
            label="Discuss"
            iconLeft="plus"
            buttonType="secondary-blue"
          />
          <CWButton
            label={bothActive ? 'Unsubscribe' : 'Subscribe'}
            iconLeft="bell"
            buttonType="secondary-blue"
            onClick={(e) => {
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
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {render(PopoverMenu, {
              transitionDuration: 0,
              closeOnOutsideClick: true,
              closeOnContentClick: true,
              menuAttrs: { size: 'default' },
              content: [
                render(MenuItem, {
                  iconLeft: Icons.COPY,
                  label: 'Copy URL',
                  onclick: async () => {
                    await navigator.clipboard.writeText(path);
                  },
                }),
                render(MenuItem, {
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
        <div className="interaction-counts">
          {viewCount && viewCount > 0 && (
            <div className="icon-and-count">
              <CWIcon iconName="views" class="count-icon" />
              <CWText class="count-text">{viewCount}</CWText>
            </div>
          )}
          {likeCount && likeCount > 0 && (
            <div className="icon-and-count">
              <CWIcon iconName="heartFilled" class="count-icon" />
              <CWText class="count-text">{likeCount}</CWText>
            </div>
          )}
          {commentCount && commentCount > 0 && (
            <div className="icon-and-count">
              <CWIcon iconName="feedback" class="count-icon" />
              <CWText class="count-text">{commentCount}</CWText>
            </div>
          )}
        </div>
      </div>
    );
  }
}

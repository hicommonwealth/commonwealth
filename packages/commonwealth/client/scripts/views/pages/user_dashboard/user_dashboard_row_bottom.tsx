/* @jsx jsx */
import React from 'react';

import { NotificationCategories } from 'common-common/src/types';
import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';

import 'pages/user_dashboard/user_dashboard_row_bottom.scss';

import app from 'state';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
import { SharePopover } from '../../components/share_popover';
import { subscribeToThread } from './helpers';

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
            <SharePopover
              renderTrigger={(onclick) => (
                <CWButton
                  label="Share"
                  iconLeft="share"
                  buttonType="secondary-blue"
                  onClick={onclick}
                />
              )}
            />
          </div>
        </div>
        <div className="interaction-counts">
          {viewCount && viewCount > 0 && (
            <div className="icon-and-count">
              <CWIcon iconName="views" className="count-icon" />
              <CWText className="count-text">{viewCount}</CWText>
            </div>
          )}
          {likeCount && likeCount > 0 && (
            <div className="icon-and-count">
              <CWIcon iconName="heartFilled" className="count-icon" />
              <CWText className="count-text">{likeCount}</CWText>
            </div>
          )}
          {commentCount && commentCount > 0 && (
            <div className="icon-and-count">
              <CWIcon iconName="feedback" className="count-icon" />
              <CWText className="count-text">{commentCount}</CWText>
            </div>
          )}
        </div>
      </div>
    );
  }
}

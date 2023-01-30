/* @jsx jsx */
import React from 'react';

import { formatTimestamp } from 'helpers/index';
import {
  ClassComponent,
  ResultNode,
  setRoute,
  jsx,
} from 'mithrilInterop';
import { capitalize } from 'lodash';
import { AddressInfo } from 'models';
import moment from 'moment';

import 'pages/user_dashboard/user_dashboard_row_top.scss';

import app from 'state';
import { User } from 'views/components/user/user';
import { CWText } from '../../components/component_kit/cw_text';
import { getCommentPreview } from './helpers';

type UserDashboardRowTopAttrs = {
  activityData: any;
  category: string;
};

export class UserDashboardRowTop extends ClassComponent<UserDashboardRowTopAttrs> {
  view(vnode: ResultNode<UserDashboardRowTopAttrs>) {
    const { commentCount } = vnode.attrs.activityData;

    const {
      created_at,
      chain_id,
      root_id,
      root_title,
      author_chain,
      author_address,
      comment_text,
      root_type,
    } = JSON.parse(vnode.attrs.activityData.notificationData);

    const numericalCommentCount = Number(commentCount);

    const communityName =
      app.config.chains.getById(chain_id)?.name || 'Unknown chain';

    let decodedTitle;

    try {
      decodedTitle = decodeURIComponent(root_title).trim();
    } catch {
      decodedTitle = root_title.trim();
    }

    const titleText =
      decodedTitle.length < 1
        ? `${capitalize(root_type)} ${root_id}`
        : decodedTitle.length > 50
        ? `${decodedTitle.slice(0, 47)}...`
        : decodedTitle;

    const actorName = (
      <User
        user={
          new AddressInfo(null, author_address, author_chain ?? chain_id, null)
        }
        hideIdentityIcon={false}
        linkify
        avatarSize={16}
        onclick={(e: any) => {
          e.preventDefault();
          e.stopPropagation();
          m.route.set(`/${author_chain}/account/${author_address}`);
        }}
      />
    );

    if (vnode.attrs.category === 'new-comment-creation') {
      return (
        <div className="UserDashboardRowTop">
          <CWText className="row-top-text">
            {actorName}
            <span>
              {numericalCommentCount > 1 &&
                `and ${numericalCommentCount - 1} others `}
              commented on
            </span>
            <b>{titleText}</b>
            <span>in</span>
            <a
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setRoute(`/${chain_id}`);
              }}
            >
              {communityName}
            </a>
            <span>({formatTimestamp(moment(created_at))})</span>
          </CWText>
          <div className="comment-preview-container">
            {getCommentPreview(comment_text)}
          </div>
        </div>
      );
    } else if (vnode.attrs.category === 'new-thread-creation') {
      return (
        <div className="UserDashboardRowTop">
          <CWText className="row-top-text">
            {actorName}
            <span>created new thread</span>
            <b>{titleText}</b>
            <span>in</span>
            <a
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setRoute(`/${chain_id}`);
              }}
            >
              {communityName}
            </a>
            <span>{formatTimestamp(moment(created_at))}</span>
          </CWText>
        </div>
      );
    }

    return <div className="UserDashboardRowTop">{actorName}</div>;
  }
}

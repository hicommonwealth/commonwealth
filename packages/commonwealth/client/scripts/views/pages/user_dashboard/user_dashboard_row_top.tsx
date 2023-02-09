import React from 'react';

import { formatTimestamp } from 'helpers/index';
import { ClassComponent, setRoute} from

 'mithrilInterop';
import type { ResultNode } from 'mithrilInterop';
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

    const communityName =
      app.config.chains.getById(chain_id)?.name || 'Unknown chain';

    const communityIcon = app.config.chains.getById(chain_id)?.iconUrl;

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
        linkify
        avatarSize={16}
        onclick={(e: any) => {
          e.preventDefault();
          e.stopPropagation();
          setRoute(`/${author_chain}/account/${author_address}`);
        }}
      />
    );

    const isComment = vnode.attrs.category === 'new-comment-creation';

    return (
      <div className="UserDashboardRowTop">
        <div className="community-info">
          <img className="icon" src={communityIcon} />
          <CWText type="caption" fontWeight="medium">
            <a
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setRoute(`/${chain_id}`);
              }}
            >
              {communityName}
            </a>
          </CWText>
          <div className="dot">.</div>
          <CWText type="caption" fontWeight="medium" className="gray-text">
            {moment(created_at).format('MM/DD/YY')}
          </CWText>
        </div>
        <div className="comment-thread-info">
          <CWText noWrap fontWeight="semiBold">
            {actorName}&nbsp;
            <span className="info-type">
              {isComment ? 'commented on the thread' : 'created a thread'}&nbsp;
            </span>
            <span className="thread-title">{titleText}</span>
          </CWText>
        </div>
        <div className="comment-preview">{getCommentPreview(comment_text)}</div>
      </div>
    );
  }
}

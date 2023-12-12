import { capitalize } from 'lodash';
import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import 'pages/user_dashboard/user_dashboard_row_top.scss';
import React from 'react';
import { Link } from 'react-router-dom';
import app from 'state';
import { User } from 'views/components/user/user';
import { CWText } from '../../components/component_kit/cw_text';
import { QuillRenderer } from '../../components/react_quill_editor/quill_renderer';
import { UserDashboardRowTopSkeleton } from './UserDashboardRowTopSkeleton';

type UserDashboardRowTopProps = {
  activityData: any;
  category: string;
  showSkeleton?: boolean;
};

export const UserDashboardRowTop = (props: UserDashboardRowTopProps) => {
  const { activityData, category, showSkeleton } = props;
  const navigate = useCommonNavigate();

  if (showSkeleton) {
    return <UserDashboardRowTopSkeleton />;
  }

  const {
    created_at,
    chain_id,
    thread_id,
    root_title,
    author_chain,
    author_address,
    comment_text,
    root_type,
  } = JSON.parse(activityData.notificationData);

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
      ? `${capitalize(root_type)} ${thread_id}`
      : decodedTitle.length > 50
      ? `${decodedTitle.slice(0, 47)}...`
      : decodedTitle;

  const actorName = (
    <span
      onClick={(e: any) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(`/${author_chain}/account/${author_address}`);
      }}
    >
      <User
        userAddress={author_address}
        userCommunityId={author_chain}
        shouldLinkProfile
        avatarSize={16}
      />
    </span>
  );

  const isComment = category === 'new-comment-creation';

  return (
    <div className="UserDashboardRowTop">
      <div className="community-info">
        <img className="icon" src={communityIcon} />
        <CWText type="caption" fontWeight="medium">
          <Link
            onClick={(e) => {
              e.stopPropagation();
            }}
            to={`/${chain_id}`}
          >
            {communityName}
          </Link>
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
      <div className="comment-preview">
        {<QuillRenderer doc={comment_text} />}
      </div>
    </div>
  );
};

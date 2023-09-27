import 'pages/user_dashboard/user_dashboard_row_top.scss';
import React from 'react';
import { Skeleton } from '../../components/Skeleton';
import { CWText } from '../../components/component_kit/cw_text';

export const UserDashboardRowTopSkeleton = () => {
  return (
    <div className="UserDashboardRowTop">
      <div className="community-info">
        <Skeleton className="icon" circle width={16} height={16} />
        <CWText type="caption" fontWeight="medium">
          <Skeleton width={100} />
        </CWText>
        <div className="dot">.</div>
        <CWText type="caption" fontWeight="medium" className="gray-text">
          <Skeleton width={100} />
        </CWText>
      </div>
      <div className="comment-thread-info">
        <Skeleton width={'90%'} />
      </div>
      <div className="comment-preview">
        <Skeleton width={'70%'} />
      </div>
    </div>
  );
};

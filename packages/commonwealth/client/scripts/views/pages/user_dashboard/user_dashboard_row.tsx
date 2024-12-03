import React from 'react';
import { Skeleton } from 'views/components/Skeleton';
import { CWText } from 'views/components/component_kit/cw_text';
import './user_dashboard_row.scss';
import './user_dashboard_row_top.scss';

export const UserDashboardRowSkeleton = () => {
  return (
    <div className="UserDashboardRow">
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
          <Skeleton width="90%" />
        </div>
        <div className="comment-preview">
          <Skeleton width="70%" />
        </div>
      </div>
      <div className="UserDashboardRowBottom">
        <div className="comments">
          <div className="count">
            <Skeleton width={100} />
          </div>
          <div>
            <Skeleton width={50} />
          </div>
        </div>
        <div className="actions">
          <Skeleton width={100} />
        </div>
      </div>
    </div>
  );
};

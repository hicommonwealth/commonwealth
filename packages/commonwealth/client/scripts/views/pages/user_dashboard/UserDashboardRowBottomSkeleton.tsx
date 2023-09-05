import 'pages/user_dashboard/user_dashboard_row_bottom.scss';
import React from 'react';
import { Skeleton } from '../../components/Skeleton';

export const UserDashboardRowBottomSkeleton = () => {
  return (
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
  );
};

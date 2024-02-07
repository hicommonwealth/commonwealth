import 'pages/overview/TopicSummaryRow.scss';
import React from 'react';
import { Skeleton } from '../../components/Skeleton';
import { CWDivider } from '../../components/component_kit/cw_divider';
import { getClasses } from '../../components/component_kit/helpers';

export const TopicSummaryRowSkeleton = () => {
  return (
    <div className="TopicSummaryRow">
      <div className="topic-column">
        <div className="name-and-count">
          <Skeleton count={2} />
        </div>
      </div>
      <div className="recent-threads-column">
        {Array(2)
          .fill(undefined)
          .map((x, idx) => (
            <div key={idx}>
              <div
                className={getClasses<{ isLoading?: boolean }>(
                  { isLoading: true },
                  'recent-thread-row'
                )}
              >
                <Skeleton count={4} />
              </div>
              <CWDivider />
            </div>
          ))}
      </div>
    </div>
  );
};

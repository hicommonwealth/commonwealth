import 'components/sidebar/CommunitySection/CommunitySectionSkeleton.scss';
import React from 'react';
import { Skeleton } from '../../Skeleton';

export const CommunitySectionSkeleton = ({
  // eslint-disable-next-line react/prop-types
  sections = 3,
  // eslint-disable-next-line react/prop-types
  itemsPerSection = 5,
}) => {
  return (
    <div className="community-menu">
      <div className="community-menu-skeleton">
        {Array.from({ length: sections }).map((x, index) => (
          <div
            className={`community-menu-skeleton-section ${
              index > 0 ? 'mt-16' : ''
            }`}
            key={index}
          >
            <Skeleton width={'100%'} height={25} />
            <div className="community-menu-skeleton-section-items">
              {Array.from({ length: itemsPerSection }).map((n, i) => (
                <div key={i}>
                  <Skeleton width={'90%'} height={20} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

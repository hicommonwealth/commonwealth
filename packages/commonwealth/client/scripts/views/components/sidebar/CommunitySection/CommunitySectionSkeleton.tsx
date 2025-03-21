import React from 'react';
import { Skeleton } from '../../Skeleton';
import './CommunitySectionSkeleton.scss';

type CommunitySectionSkeletonProps = {
  sections?: number;
  itemsPerSection?: number;
};

export const CommunitySectionSkeleton = ({
  sections = 3,
  itemsPerSection = 5,
}: CommunitySectionSkeletonProps) => {
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
            <Skeleton width="100%" height={25} />
            <div className="community-menu-skeleton-section-items">
              {Array.from({ length: itemsPerSection }).map((n, i) => (
                <div key={i}>
                  <Skeleton width="90%" height={20} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

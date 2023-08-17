import 'components/component_kit/CWContentPage.scss';
import React from 'react';
import { Skeleton } from '../../Skeleton';
import { ComponentType } from '../types';

export const CWContentPageSkeleton = ({ isWindowMedium }) => {
  const mainBody = (
    <div className="main-body-container">
      {/* thread header */}
      <div className="header">
        <Skeleton width={'90%'} />
        <Skeleton />
      </div>

      {/* thread title */}
      <Skeleton />

      {/* thread description */}
      <div>
        <Skeleton width={'80%'} />
        <Skeleton />
        <Skeleton width={'90%'} />
        <Skeleton />
        <Skeleton width={'95%'} />
      </div>

      {/* comment input */}
      <div>
        <Skeleton height={200} />
      </div>

      {/* comment filter row */}
      <Skeleton />

      {/* mimics comments */}
      <div>
        <Skeleton width={'80%'} />
        <Skeleton width={'100%'} />
        <Skeleton width={'90%'} />
      </div>
      <div>
        <Skeleton width={'90%'} />
        <Skeleton width={'25%'} />
      </div>
    </div>
  );

  return (
    <div className={ComponentType.ContentPage}>
      <div className="sidebar-view">
        {mainBody}
        {isWindowMedium && (
          <div className="sidebar">
            <div className="cards-column">
              <Skeleton width={'80%'} />
              <Skeleton width={'100%'} />
              <Skeleton width={'50%'} />
              <Skeleton width={'75%'} />
            </div>
            <div className="cards-column">
              <Skeleton width={'80%'} />
              <Skeleton width={'100%'} />
              <Skeleton width={'50%'} />
              <Skeleton width={'75%'} />
            </div>
            <div className="cards-column">
              <Skeleton width={'80%'} />
              <Skeleton width={'100%'} />
              <Skeleton width={'50%'} />
              <Skeleton width={'75%'} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

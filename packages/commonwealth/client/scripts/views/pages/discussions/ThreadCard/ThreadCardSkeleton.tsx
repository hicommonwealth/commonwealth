import React from 'react';
import { Skeleton } from 'views/components/Skeleton';
import './ThreadCard.scss';
import { ReactionButton } from './ThreadOptions/ReactionButton';

// eslint-disable-next-line react/prop-types
export const CardSkeleton = ({ isWindowSmallInclusive, thread, disabled }) => {
  return (
    <div className={'ThreadCard showSkeleton'}>
      {!isWindowSmallInclusive && (
        <ReactionButton
          thread={thread}
          size="big"
          showSkeleton
          disabled={disabled}
        />
      )}
      <div className="content-wrapper">
        <div>
          <Skeleton count={1} className="content-header-skeleton" />
          <div>
            {' '}
            <Skeleton className="content-header-icons-skeleton" />{' '}
          </div>
        </div>
        <div className="content-body-wrapper">
          <Skeleton count={3} />
        </div>
      </div>
      <div className="content-footer">
        <Skeleton />
      </div>
    </div>
  );
};

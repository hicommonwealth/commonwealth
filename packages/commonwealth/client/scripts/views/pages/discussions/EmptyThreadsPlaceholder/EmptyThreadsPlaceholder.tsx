import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { ThreadCard } from '../ThreadCard';
import './EmptyThreadsPlaceholder.scss';

type HeaderWithFiltersProps = {
  isInitialLoading: boolean;
  isOnArchivePage: boolean;
};

export const EmptyThreadsPlaceholder = ({
  isInitialLoading,
  isOnArchivePage,
}: HeaderWithFiltersProps) => {
  return isInitialLoading ? (
    <div className="EmptyThreadsSkeletonContainer">
      {Array(3)
        .fill({})
        .map((x, i) => (
          <ThreadCard key={i} showSkeleton thread={{} as any} />
        ))}
    </div>
  ) : (
    <CWText type="b1" className="EmptyThreadsPlaceholderText">
      {isOnArchivePage
        ? 'There are no archived threads matching your filter.'
        : 'There are no threads matching your filter.'}
    </CWText>
  );
};

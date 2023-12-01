import React from 'react';
import { CWText } from '../../components/component_kit/cw_text';
import { ThreadCard } from './ThreadCard/index';

type DiscussionsPageEmptyPlaceholderProps = {
  isInitialLoading: boolean;
  isOnArchivePage: boolean;
};

export const DiscussionsPageEmptyPlaceholder = ({
  isInitialLoading,
  isOnArchivePage,
}: DiscussionsPageEmptyPlaceholderProps) => {
  return isInitialLoading ? (
    <div className="threads-wrapper">
      {Array(3)
        .fill({})
        .map((x, i) => (
          <ThreadCard key={i} showSkeleton thread={{} as any} />
        ))}
    </div>
  ) : (
    <CWText type="b1" className="no-threads-text">
      {isOnArchivePage
        ? 'There are no archived threads matching your filter.'
        : 'There are no threads matching your filter.'}
    </CWText>
  );
};

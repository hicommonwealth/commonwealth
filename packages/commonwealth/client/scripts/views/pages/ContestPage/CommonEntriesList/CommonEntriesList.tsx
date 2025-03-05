import React from 'react';
import { Select } from 'views/components/Select';
import { Skeleton } from 'views/components/Skeleton';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWUpvote } from 'views/components/component_kit/new_designs/cw_upvote';
import { SortType, sortOptions } from '../types';

import './CommonEntriesList.scss';

interface CommonEntriesListProps {
  isLoading: boolean;
  entries: Array<{
    id: string;
    calculated_vote_weight: string;
    author: {
      username: string;
    };
    content: string;
  }>;
  selectedSort: SortType;
  onSortChange: (sort: SortType) => void;
}

export const CommonEntriesList = ({
  isLoading,
  entries,
  selectedSort,
  onSortChange,
}: CommonEntriesListProps) => {
  if (isLoading) {
    return (
      <>
        <Skeleton height={300} width="100%" />
        <Skeleton height={300} width="100%" />
      </>
    );
  }

  if (!entries.length) {
    return <CWText>No entries for the contest yet</CWText>;
  }

  return (
    <div className="CommonEntriesList">
      <div className="filter-section">
        <CWText type="b2" fontWeight="medium">
          Sort
        </CWText>
        <Select
          selected={selectedSort}
          onSelect={(v: { value: string; label: string }) =>
            onSortChange(v.value as SortType)
          }
          options={sortOptions}
        />
      </div>

      {entries.map((entry) => (
        <div key={entry.id} className="entry-container">
          <CWUpvote disabled voteCount={entry.calculated_vote_weight || '0'} />

          <div className="entry-content">
            <CWText type="b2" fontWeight="medium">
              {entry.author.username}
            </CWText>
            <CWText>{entry.content}</CWText>
          </div>
        </div>
      ))}
    </div>
  );
};

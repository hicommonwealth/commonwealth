import React from 'react';
import { FarcasterEmbed } from 'react-farcaster-embed/dist/client';
import { Select } from 'views/components/Select';
import { Skeleton } from 'views/components/Skeleton';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWUpvote } from 'views/components/component_kit/new_designs/cw_upvote';
import { SortType, sortOptions } from '../types';

import './FarcasterEntriesList.scss';

interface FarcasterEntriesListProps {
  isLoading: boolean;
  entries: Array<{
    hash: string;
    calculated_vote_weight: string;
    author: {
      username: string;
    };
  }>;
  selectedSort: SortType;
  onSortChange: (sort: SortType) => void;
}

export const FarcasterEntriesList = ({
  isLoading,
  entries,
  selectedSort,
  onSortChange,
}: FarcasterEntriesListProps) => {
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
    <div className="FarcasterEntriesList">
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
        <div key={entry.hash} className="cast-container">
          <CWUpvote disabled voteCount={entry.calculated_vote_weight || '0'} />

          <FarcasterEmbed
            key={entry.hash}
            hash={entry.hash}
            username={entry.author.username}
          />
        </div>
      ))}
    </div>
  );
};

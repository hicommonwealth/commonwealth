import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import React from 'react';
import { FarcasterEmbed } from 'react-farcaster-embed/dist/client';
import { prettyVoteWeight } from 'shared/adapters/currency';
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
  contestDecimals: number;
  voteWeightMultiplier: number;
}

export const FarcasterEntriesList = ({
  isLoading,
  entries,
  selectedSort,
  onSortChange,
  contestDecimals,
  voteWeightMultiplier,
}: FarcasterEntriesListProps) => {
  if (isLoading) {
    return (
      <>
        <Skeleton height={300} width="100%" style={{ marginBottom: 16 }} />
        <Skeleton height={300} width="100%" />
      </>
    );
  }

  if (!entries.length) {
    return <CWText>No entries for the contest yet</CWText>;
  }

  const getVoteCount = (entry) => {
    return prettyVoteWeight(
      entry.calculated_vote_weight,
      contestDecimals,
      TopicWeightedVoting.ERC20,
      voteWeightMultiplier,
      1,
    );
  };

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
          <CWUpvote disabled voteCount={getVoteCount(entry)} />

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

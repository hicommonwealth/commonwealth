import Thread from 'client/scripts/models/Thread';
import React from 'react';
import { Select } from 'views/components/Select';
import { Skeleton } from 'views/components/Skeleton';
import { CWText } from 'views/components/component_kit/cw_text';
import { RenderThreadCard } from 'views/pages/discussions/RenderThreadCard';
import useCommunityContests from '../../CommunityManagement/Contests/useCommunityContests';
import { SortType, sortOptions } from '../types';

import './CommonEntriesList.scss';

interface CommonEntriesListProps {
  isLoading: boolean;
  entries: Thread[];
  selectedSort: SortType;
  onSortChange: (sort: SortType) => void;
  communityId: string;
}

export const CommonEntriesList = ({
  isLoading,
  entries,
  selectedSort,
  onSortChange,
  communityId,
}: CommonEntriesListProps) => {
  const { contestsData } = useCommunityContests();

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

      {entries.map((thread) => (
        <RenderThreadCard
          key={thread.id}
          thread={thread}
          communityId={communityId}
          contestsData={contestsData}
        />
      ))}
    </div>
  );
};

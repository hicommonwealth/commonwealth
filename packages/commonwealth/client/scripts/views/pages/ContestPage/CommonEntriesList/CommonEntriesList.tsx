import Thread from 'client/scripts/models/Thread';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { Select } from 'views/components/Select';
import { Skeleton } from 'views/components/Skeleton';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { RenderThreadCard } from 'views/pages/discussions/RenderThreadCard';
import useCommunityContests from '../../CommunityManagement/Contests/useCommunityContests';
import { isContestActive } from '../../CommunityManagement/Contests/utils';
import { SortType, sortOptions } from '../types';
import './CommonEntriesList.scss';

interface CommonEntriesListProps {
  isLoading: boolean;
  entries: Thread[];
  selectedSort: SortType;
  onSortChange: (sort: SortType) => void;
  communityId: string;
  contestAddress: string;
}

export const CommonEntriesList = ({
  isLoading,
  entries,
  selectedSort,
  onSortChange,
  communityId,
  contestAddress,
}: CommonEntriesListProps) => {
  const { contestsData, getContestByAddress } = useCommunityContests();
  const navigate = useCommonNavigate();

  const contest = getContestByAddress(contestAddress);

  if (isLoading) {
    return (
      <>
        <Skeleton height={300} width="100%" style={{ marginBottom: 16 }} />
        <Skeleton height={300} width="100%" />
      </>
    );
  }

  const isActive = isContestActive({
    contest: {
      cancelled: Boolean(contest?.cancelled),
      contests: [
        { end_time: new Date(contest?.contests?.[0]?.end_time || '') },
      ],
    },
  });

  return (
    <div className="CommonEntriesList">
      <div className="filter-section">
        {entries.length ? (
          <>
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
          </>
        ) : (
          <CWText>No entries to the contest yet</CWText>
        )}
        {!contest?.is_farcaster_contest ? (
          <CWButton
            containerClassName="submit-entry-button"
            label="Submit entry"
            iconLeft="plus"
            disabled={!isActive}
            onClick={() => {
              navigate(
                `/new/discussion?topic=${contest?.topic_id}&cancel=${contestAddress}`,
              );
            }}
          />
        ) : null}
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

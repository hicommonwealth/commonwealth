import { ThreadFeaturedFilterTypes } from 'client/scripts/models/types';
import useFetchFarcasterCastsQuery from 'client/scripts/state/api/contests/getFarcasterCasts';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';

import { sortByFeaturedFilter } from '../../../discussions/helpers';
import CommonEntriesList from '../../CommonEntriesList';
import FarcasterEntriesList from '../../FarcasterEntriesList';
import { SortType } from '../../types';

import { Thread } from 'client/scripts/models/Thread';
import useGetThreadsQuery from 'client/scripts/state/api/threads/getThreads';
import './EntriesTab.scss';

export interface EntriesTabProps {
  contestAddress: string;
  communityId: string;
  topicId?: number;
  isFarcasterContest: boolean;
  contestDecimals: number;
  voteWeightMultiplier: number;
}

const EntriesTab = ({
  contestAddress,
  communityId,
  topicId,
  isFarcasterContest,
  contestDecimals,
  voteWeightMultiplier,
}: EntriesTabProps) => {
  const [selectedSort, setSelectedSort] = React.useState<SortType>(
    SortType.Upvotes,
  );

  const { data: farcasterCasts, isLoading: isFarcasterCastsLoading } =
    useFetchFarcasterCastsQuery({
      contest_address: contestAddress,
      selectedSort,
      isEnabled: isFarcasterContest,
    });

  const threadSort =
    selectedSort === SortType.Recent
      ? ThreadFeaturedFilterTypes.Newest
      : ThreadFeaturedFilterTypes.MostLikes;

  const { data: threads, isLoading: isThreadsLoading } = useGetThreadsQuery({
    community_id: communityId || '',
    cursor: 1,
    limit: 30,
    topic_id: topicId,
    order_by: threadSort,
    enabled: !isFarcasterContest,
    contestAddress,
  });

  const handleSortChange = (sort: SortType) => {
    setSelectedSort(sort);
  };

  // TODO: Replace Thread with ThreadView -> should we use Memo here?
  const sortedThreads = sortByFeaturedFilter(
    threads?.pages.flatMap((p) => p.results.map((t) => new Thread(t))) || [],
    threadSort,
  );

  return (
    <div className="EntriesTab">
      <CWText type="h3" fontWeight="semiBold">
        Entries
      </CWText>

      {isFarcasterContest ? (
        <FarcasterEntriesList
          isLoading={isFarcasterCastsLoading}
          entries={farcasterCasts || []}
          selectedSort={selectedSort}
          onSortChange={handleSortChange}
          contestDecimals={contestDecimals}
          voteWeightMultiplier={voteWeightMultiplier}
        />
      ) : (
        <CommonEntriesList
          isLoading={isThreadsLoading}
          entries={sortedThreads || []}
          selectedSort={selectedSort}
          onSortChange={handleSortChange}
          communityId={communityId}
          contestAddress={contestAddress}
        />
      )}
    </div>
  );
};

export default EntriesTab;

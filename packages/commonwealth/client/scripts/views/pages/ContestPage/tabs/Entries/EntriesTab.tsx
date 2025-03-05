import useFetchFarcasterCastsQuery from 'client/scripts/state/api/contests/getFarcasterCasts';
import useFetchThreadsQuery from 'client/scripts/state/api/threads/fetchThreads';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';

import CommonEntriesList from '../../CommonEntriesList';
import FarcasterEntriesList from '../../FarcasterEntriesList';
import { SortType } from '../../types';

import './EntriesTab.scss';

export interface EntriesTabProps {
  contestAddress: string;
  communityId: string;
  topicId?: number;
  isFarcasterContest: boolean;
}

const EntriesTab = ({
  contestAddress,
  communityId,
  topicId,
  isFarcasterContest,
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

  const { data: threads, isLoading: isThreadsLoading } = useFetchThreadsQuery({
    communityId: communityId || '',
    queryType: 'bulk',
    page: 1,
    limit: 30,
    topicId,
    apiEnabled: !isFarcasterContest,
  });

  const handleSortChange = (sort: SortType) => {
    setSelectedSort(sort);
  };

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
        />
      ) : (
        <CommonEntriesList
          isLoading={isThreadsLoading}
          entries={threads || []}
          selectedSort={selectedSort}
          onSortChange={handleSortChange}
          communityId={communityId}
        />
      )}
    </div>
  );
};

export default EntriesTab;

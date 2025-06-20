import React, { useCallback, useMemo, useState } from 'react';

import app from 'state';
import { useDebounce } from 'usehooks-ts';
import { QueryList } from 'views/components/component_kit/cw_query_list';
import { ThreadSelectorItem } from 'views/components/thread_selector/thread_selector_item';
import {
  APIOrderBy,
  APIOrderDirection,
} from '../../../../scripts/helpers/constants';
import { useSearchThreadsQuery } from '../../../../scripts/state/api/threads';
import Thread from '../../../models/Thread';
import { CWTextInput } from '../component_kit/cw_text_input';
import './thread_selector.scss';

type ThreadSelectorProps = {
  linkedThreadsToSet: Array<Thread>;
  onSelect: (selectedThread: Thread) => void;
};

export const ThreadSelector = ({
  linkedThreadsToSet,
  onSelect,
}: ThreadSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const debouncedSearchTerm = useDebounce<string>(searchTerm, 500);

  const communityId = app.activeChainId() || '';
  const queryEnabled = debouncedSearchTerm?.trim().length > 0 && !!communityId;

  const { data: threadsData, isLoading } = useSearchThreadsQuery({
    community_id: communityId,
    search_term: debouncedSearchTerm,
    cursor: 1,
    limit: 5,
    order_by: APIOrderBy.Rank,
    order_direction: APIOrderDirection.Desc,
    thread_title_only: true,
    include_count: true,
    enabled: queryEnabled,
  });

  const searchResults = useMemo(() => {
    // TODO: replace Thread with ThreadView
    return (
      threadsData?.pages.flatMap((p) => p.results.map((t) => new Thread(t))) ||
      []
    );
  }, [threadsData]);

  const getEmptyContentMessage = () => {
    if (!queryEnabled) {
      return 'Type a thread title to search';
    } else if (searchResults.length === 0) {
      return 'No threads found';
    } else if (!linkedThreadsToSet?.length) {
      return 'No currently linked threads';
    }
  };

  const options = !queryEnabled ? linkedThreadsToSet : searchResults;

  const handleInputChange = (e: any) => {
    setSearchTerm(e.target.value);
  };

  const handleClearButtonClick = () => {
    setSearchTerm('');
  };

  const renderItem = useCallback(
    (i: number, thread: Thread) => {
      const isSelected = linkedThreadsToSet.some((lt) => +lt.id === +thread.id);

      return (
        <ThreadSelectorItem
          thread={thread}
          onClick={onSelect}
          isSelected={isSelected}
        />
      );
    },
    [linkedThreadsToSet, onSelect],
  );

  return (
    <div className="ThreadSelector">
      <CWTextInput
        placeholder="Search thread titles..."
        iconRightonClick={handleClearButtonClick}
        value={searchTerm}
        iconRight={searchTerm ? 'close' : 'magnifyingGlass'}
        onInput={handleInputChange}
      />

      <QueryList
        loading={queryEnabled ? isLoading : false}
        options={options}
        components={{
          // eslint-disable-next-line react/no-multi-comp
          EmptyPlaceholder: () => (
            <div className="empty-component">{getEmptyContentMessage()}</div>
          ),
        }}
        renderItem={renderItem}
      />
    </div>
  );
};

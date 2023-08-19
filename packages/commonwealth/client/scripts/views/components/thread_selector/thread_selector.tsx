import React, { useCallback, useEffect, useMemo, useState } from 'react';

import 'components/thread_selector.scss';
import NewProfilesController from '../../../controllers/server/newProfiles';
import Thread from '../../../models/Thread';
import app from 'state';
import { CWTextInput } from '../component_kit/cw_text_input';
import { QueryList } from 'views/components/component_kit/cw_query_list';
import { ThreadSelectorItem } from 'views/components/thread_selector/thread_selector_item';
import { useDebounce } from 'usehooks-ts';
import { useSearchThreadsQuery } from '../../../../scripts/state/api/threads';
import {
  APIOrderBy,
  APIOrderDirection,
} from '../../../../scripts/helpers/constants';

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

  const sharedQueryOptions = {
    chainId: app.activeChainId(),
    searchTerm: debouncedSearchTerm,
    limit: 5,
    orderBy: APIOrderBy.Rank,
    orderDirection: APIOrderDirection.Desc,
    threadTitleOnly: true,
  };
  const queryEnabled = debouncedSearchTerm?.trim().length > 0;

  const { data: threadsData, isLoading } = useSearchThreadsQuery({
    ...sharedQueryOptions,
    enabled: queryEnabled,
  });

  const searchResults = useMemo(() => {
    const threads = threadsData?.pages?.[0]?.results || [];
    return threads.map(
      (t) =>
        new Thread({
          id: t.id,
          title: t.title,
          chain: t.chain,
          Address: t.address,
        } as any)
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
    [linkedThreadsToSet, onSelect]
  );

  const EmptyComponent = () => (
    <div className="empty-component">{getEmptyContentMessage()}</div>
  );

  // when results loaded, get profiles
  useEffect(() => {
    searchResults.forEach((thread) => {
      NewProfilesController.Instance.getProfile(thread.chain, thread.author);
    });
  }, [searchResults]);

  return (
    <div className="ThreadSelector">
      <CWTextInput
        placeholder="Search thread titles..."
        iconRightonClick={handleClearButtonClick}
        value={searchTerm}
        iconRight="close"
        onInput={handleInputChange}
      />

      <QueryList
        loading={queryEnabled ? isLoading : false}
        options={options}
        components={{ EmptyPlaceholder: EmptyComponent }}
        renderItem={renderItem}
      />
    </div>
  );
};

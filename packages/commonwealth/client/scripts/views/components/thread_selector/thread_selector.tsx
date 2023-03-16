import React, { useCallback, useState } from 'react';

import 'components/thread_selector.scss';
import { notifyError } from 'controllers/app/notifications';
import type { Thread } from 'models';
import type { SearchParams } from 'models/SearchQuery';
import app from 'state';
import { CWTextInput } from '../component_kit/cw_text_input';
import { QueryList } from 'views/components/component_kit/cw_query_list';
import { ThreadSelectorItem } from 'views/components/thread_selector/thread_selector_item';

type ThreadSelectorProps = {
  linkedThreadsToSet: Array<Thread>;
  onSelect: (selectedThread: Thread) => void;
};

export const ThreadSelector = ({
  linkedThreadsToSet,
  onSelect,
}: ThreadSelectorProps) => {
  const [inputTimeout, setInputTimeout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Thread[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyLinkedThreads, setShowOnlyLinkedThreads] = useState(true);

  const queryLength = searchTerm?.trim()?.length;

  const getEmptyContentMessage = () => {
    if (queryLength > 0 && queryLength < 5) {
      return 'Query too short';
    } else if (queryLength >= 5 && !searchResults.length) {
      return 'No threads found';
    } else if (!linkedThreadsToSet?.length) {
      return 'No currently linked threads';
    }
  };

  const options =
    showOnlyLinkedThreads && !queryLength ? linkedThreadsToSet : searchResults;

  const handleInputChange = (e) => {
    const target = e.target as HTMLInputElement;
    clearTimeout(inputTimeout);
    setSearchTerm(target.value);
    setShowOnlyLinkedThreads(false);

    const inputTimeoutRef = setTimeout(async () => {
      if (target.value?.trim().length > 4) {
        setLoading(true);
        const params: SearchParams = {
          chainScope: app.activeChainId(),
          resultSize: 20,
        };

        app.search
          .searchThreadTitles(searchTerm, params)
          .then((results) => {
            setSearchResults(results);
            setLoading(false);
            results.forEach((thread) => {
              app.profiles.getProfile(thread.authorChain, thread.author);
            });
          })
          .catch(() => {
            setLoading(false);
            notifyError('Could not find matching thread');
          });
      } else if (target.value?.length === 0) {
        setShowOnlyLinkedThreads(true);
      }
    }, 250);
    setInputTimeout(inputTimeoutRef);
  };

  const handleClearButtonClick = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowOnlyLinkedThreads(true);
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
        loading={loading}
        options={options}
        components={{ EmptyPlaceholder: EmptyComponent }}
        renderItem={renderItem}
      />
    </div>
  );
};

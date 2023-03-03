import React, { useState } from 'react';

import 'components/thread_selector.scss';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import type { Thread } from 'models';
import type { SearchParams } from 'models/SearchQuery';
import app from 'state';
import { CWSpinner } from './component_kit/cw_spinner';
import { CWTextInput } from './component_kit/cw_text_input';
import { Virtuoso } from 'react-virtuoso';
import { formatAddressShort } from 'utils';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWCheck } from 'views/components/component_kit/cw_icons/cw_icons';

// The thread-to-thread relationship is comprised of linked and linking threads,
// i.e. child and parent nodes.

type ThreadSelectorProps = {
  linkedThreads: Array<Thread>;
  linkingThread: Thread;
};

interface ThreadPreviewProps {
  linkedThreads: Array<Thread>;
  thread: Thread;
  onClick: (thread: Thread) => void;
}

const ThreadPreview = ({
  linkedThreads,
  thread,
  onClick,
}: ThreadPreviewProps) => {
  const selected = linkedThreads.some((lt) => +lt.id === +thread.id);
  const author = app.profiles.getProfile(thread.authorChain, thread.author);

  return (
    <div className="thread-preview-row" onClick={() => onClick(thread)}>
      <div className="selected">{selected && <CWCheck />}</div>
      <div>
        <CWText fontWeight="medium" noWrap>
          {thread.title}
        </CWText>
        <CWText type="caption">
          {author.name
            ? `${author.name} • ${formatAddressShort(thread.author)}`
            : thread.author}
        </CWText>
      </div>
    </div>
  );
};

// todo simplify handler functions
// todo make query list generic
// todo make liking thread work (rerender properly on click and save)
export const ThreadSelector = ({
  linkedThreads: linkedThreadsProp = [],
  linkingThread,
}: ThreadSelectorProps) => {
  const [inputTimeout, setInputTimeout] = useState(null);
  const [linkedThreads, setLinkedThreads] =
    useState<Thread[]>(linkedThreadsProp);
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
    } else if (!linkedThreads?.length) {
      return 'No currently linked threads';
    }
  };

  const options =
    showOnlyLinkedThreads && !queryLength ? linkedThreads : searchResults;

  const EmptyComp = () => (
    <div className="empty-component">{getEmptyContentMessage()}</div>
  );

  const onClick = (thread: Thread) => {
    const selectedThreadIdx = linkedThreads.findIndex(
      (linkedThread) => linkedThread.id === thread.id
    );

    if (selectedThreadIdx !== -1) {
      app.threads
        .removeLinkedThread(linkingThread.id, thread.id)
        .then(() => {
          const newLinkedThreads = linkedThreads.splice(selectedThreadIdx, 1);
          setLinkedThreads(newLinkedThreads);
          notifySuccess('Thread unlinked.');
        })
        .catch(() => {
          notifyError('Thread failed to unlink.');
        });
    } else {
      app.threads
        .addLinkedThread(linkingThread.id, thread.id)
        .then(() => {
          const newLinkedThreads = [...linkedThreads, thread];
          setLinkedThreads(newLinkedThreads);
          notifySuccess('Thread linked.');
        })
        .catch(() => {
          notifyError('Thread failed to link.');
        });
    }
  };

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

  return (
    <div className="ThreadSelector">
      <CWTextInput
        placeholder="Search thread titles..."
        iconRightonClick={handleClearButtonClick}
        value={searchTerm}
        iconRight="close"
        onInput={handleInputChange}
      />

      <div className="results">
        {loading ? (
          <CWSpinner />
        ) : (
          <Virtuoso
            data={options}
            components={{ EmptyPlaceholder: EmptyComp }}
            itemContent={(i, data) => (
              <ThreadPreview
                linkedThreads={linkedThreads}
                thread={data}
                onClick={onClick}
              />
            )}
          />
        )}
      </div>
    </div>
  );
};

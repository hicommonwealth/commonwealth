/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import { ListItem, QueryList } from 'construct-ui';

import 'components/thread_selector.scss';

import app from 'state';
import { Thread } from 'models';
import { SearchParams } from 'models/SearchQuery';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { formatAddressShort } from '../../../../shared/utils';
import { CWTextInput } from './component_kit/cw_text_input';
import { CWText } from './component_kit/cw_text';
import { CWSpinner } from './component_kit/cw_spinner';

const renderThreadPreview = (
  linkedThreads: Array<Thread>,
  thread: Thread,
  idx: number
) => {
  const selected = linkedThreads.some((lt) => +lt.id === +thread.id);
  const author = app.profiles.getProfile(thread.authorChain, thread.author);

  return m(ListItem, {
    label: (
      <div class="thread-preview-row">
        <CWText fontWeight="medium" noWrap>
          {thread.title}
        </CWText>
        <CWText type="caption">
          {author.name
            ? `${author.name} • ${formatAddressShort(thread.author)}`
            : thread.author}
        </CWText>
      </div>
    ),
    selected,
    key: idx,
  });
};

// The thread-to-thread relationship is comprised of linked and linking threads,
// i.e. child and parent nodes.

type ThreadSelectorAttrs = {
  linkedThreads: Array<Thread>;
  linkingThread: Thread;
};

export class ThreadSelector extends ClassComponent<ThreadSelectorAttrs> {
  private inputTimeout;
  private linkedThreads: Thread[];
  private loading: boolean;
  private searchResults: Thread[];
  private searchTerm: string;
  private showOnlyLinkedThreads: boolean;

  oninit(vnode: m.Vnode<ThreadSelectorAttrs>) {
    this.showOnlyLinkedThreads = true;
    this.searchResults = [];
    this.linkedThreads = vnode.attrs.linkedThreads;
    this.searchTerm = '';
  }

  view(vnode: m.Vnode<ThreadSelectorAttrs>) {
    const { linkingThread } = vnode.attrs;
    const { searchResults } = this;

    if (!this.linkedThreads) {
      this.linkedThreads = [];
    }

    const { linkedThreads } = this;

    const queryLength = this.searchTerm?.trim()?.length;

    const getEmptyContentMessage = () => {
      if (queryLength > 0 && queryLength < 5) {
        return 'Query too short';
      } else if (queryLength >= 5 && !searchResults.length) {
        return 'No threads found';
      } else if (!linkedThreads?.length) {
        return 'No currently linked threads';
      }
    };

    return (
      <div class="ThreadSelector">
        {this.loading ? (
          <CWSpinner />
        ) : (
          <>
            <CWTextInput
              placeholder="Search thread titles..."
              iconRightonclick={() => {
                this.searchTerm = '';
                this.searchResults = [];
                this.showOnlyLinkedThreads = true;
              }}
              value={this.searchTerm}
              iconRight="close"
              oninput={(e) => {
                e.preventDefault();

                e.stopPropagation();

                const target = e.target as HTMLInputElement;

                clearTimeout(this.inputTimeout);

                this.searchTerm = target.value;

                this.showOnlyLinkedThreads = false;

                this.inputTimeout = setTimeout(async () => {
                  if (target.value?.trim().length > 4) {
                    const params: SearchParams = {
                      chainScope: app.activeChainId(),
                      resultSize: 20,
                    };

                    app.search
                      .searchThreadTitles(this.searchTerm, params)
                      .then((results) => {
                        this.searchResults = results;
                        results.forEach((thread) => {
                          app.profiles.getProfile(
                            thread.authorChain,
                            thread.author
                          );
                        });
                        m.redraw();
                      })
                      .catch(() => {
                        notifyError('Could not find matching thread');
                      });
                  } else if (target.value?.length === 0) {
                    this.showOnlyLinkedThreads = true;
                  }
                }, 250);
              }}
            />
            {m(QueryList, {
              filterable: false,
              checkmark: true,
              inputAttrs: {
                placeholder: 'Search for thread to link...',
              },
              emptyContent: getEmptyContentMessage(),
              items:
                this.showOnlyLinkedThreads && !queryLength
                  ? linkedThreads
                  : searchResults,
              itemRender: (item: Thread, idx) =>
                renderThreadPreview(this.linkedThreads, item, idx),
              onSelect: (thread: Thread) => {
                const selectedThreadIdx = linkedThreads.findIndex(
                  (linkedThread) => linkedThread.id === thread.id
                );

                if (selectedThreadIdx !== -1) {
                  app.threads
                    .removeLinkedThread(linkingThread.id, thread.id)
                    .then(() => {
                      this.linkedThreads.splice(selectedThreadIdx, 1);
                      notifySuccess('Thread unlinked.');
                    })
                    .catch(() => {
                      notifyError('Thread failed to unlink.');
                    });
                } else {
                  app.threads
                    .addLinkedThread(linkingThread.id, thread.id)
                    .then(() => {
                      this.linkedThreads.push(thread);
                      notifySuccess('Thread linked.');
                    })
                    .catch(() => {
                      notifyError('Thread failed to link.');
                    });
                }
              },
            })}
          </>
        )}
      </div>
    );
  }
}

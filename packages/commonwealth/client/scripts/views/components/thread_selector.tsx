/* @jsx m */

import m from 'mithril';
import { ListItem, QueryList, Spinner } from 'construct-ui';

import 'components/thread_selector.scss';

import app from 'state';
import { Thread } from 'models';
import { SearchParams } from 'models/SearchQuery';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { formatAddressShort } from '../../../../shared/utils';
import { CWTextInput } from './component_kit/cw_text_input';
import { CWIconButton } from './component_kit/cw_icon_button';

const renderThreadPreview = (state, thread: Thread, idx: number) => {
  const selected = state.linkedThreads.find((lT) => +lT.id === +thread.id);
  const author = app.profiles.getProfile(thread.authorChain, thread.author);
  return (
    <ListItem
      label={
        <div class="linked-thread-info">
          <div class="linked-thread-top">{thread.title}</div>,
          <div class="linked-thread-bottom">
            {author.name
              ? `${author.name} • ${formatAddressShort(thread.author)}`
              : thread.author}
          </div>
        </div>
      }
      selected={selected}
      key={idx}
      style={state.selectInProgress ? 'cursor: wait' : ''}
    />
  );
};

// The thread-to-thread relationship is comprised of linked and linking threads,
// i.e. child and parent nodes.

export class ThreadSelector
  implements
    m.ClassComponent<{
      linkedThreads: Thread[];
      linkingThread: Thread;
    }>
{
  private fetchingResults: boolean;
  private fetchLinkedThreads: boolean;
  private inputTimeout;
  private linkedThreads: Thread[];
  private loading: boolean;
  private searchResults: Thread[];
  private searchTerm: string;
  private selectInProgress: boolean;
  private showOnlyLinkedThreads: boolean;

  oninit(vnode) {
    this.showOnlyLinkedThreads = true;
    this.searchResults = [];
    this.linkedThreads = vnode.attrs.linkedThreads;
  }

  view(vnode) {
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
          <Spinner active fill message="Loading threads..." />
        ) : (
          <>
            <CWTextInput
              placeholder="Search thread titles..."
              oninput={(e) => {
                e.preventDefault();

                e.stopPropagation();

                const target = e.target as HTMLInputElement;

                clearTimeout(this.inputTimeout);

                this.searchTerm = target.value;

                this.showOnlyLinkedThreads = false;

                this.inputTimeout = setTimeout(async () => {
                  if (target.value?.trim().length > 4) {
                    this.fetchingResults = true;

                    const params: SearchParams = {
                      chainScope: app.activeChainId(),
                      resultSize: 20,
                    };

                    app.search
                      .searchThreadTitles(this.searchTerm, params)
                      .then((results) => {
                        this.fetchingResults = false;
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
            <CWIconButton
              iconName="close"
              onclick={(e) => {
                e.stopPropagation();
                const input = $('.ThreadSelector').find('input');
                input.prop('value', '');
                this.searchTerm = '';
                this.searchResults = [];
                this.showOnlyLinkedThreads = true;
              }}
            />
            <QueryList
              filterable={false}
              checkmark
              inputAttrs={{
                placeholder: 'Search for thread to link...',
              }}
              emptyContent={getEmptyContentMessage()}
              items={
                this.showOnlyLinkedThreads && !queryLength
                  ? linkedThreads
                  : searchResults
              }
              itemRender={(item: Thread, idx) =>
                renderThreadPreview(this, item, idx)
              }
              onSelect={(thread: Thread) => {
                const selectedThreadIdx = linkedThreads.findIndex(
                  (linkedThread) => linkedThread.id === thread.id
                );

                this.selectInProgress = true;

                if (selectedThreadIdx !== -1) {
                  app.threads
                    .removeLinkedThread(linkingThread.id, thread.id)
                    .then(() => {
                      this.linkedThreads.splice(selectedThreadIdx, 1);
                      this.selectInProgress = false;
                      notifySuccess('Thread unlinked.');
                    })
                    .catch(() => {
                      this.selectInProgress = false;
                      notifyError('Thread failed to unlink.');
                    });
                } else {
                  app.threads
                    .addLinkedThread(linkingThread.id, thread.id)
                    .then(() => {
                      this.selectInProgress = false;
                      this.linkedThreads.push(thread);
                      notifySuccess('Thread linked.');
                    })
                    .catch(() => {
                      this.selectInProgress = false;
                      notifyError('Thread failed to link.');
                    });
                }
              }}
            />
          </>
        )}
      </div>
    );
  }
}

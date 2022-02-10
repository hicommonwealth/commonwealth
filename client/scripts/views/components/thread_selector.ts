import 'components/thread_selector.scss';

import m from 'mithril';
import $ from 'jquery';
import {
  ListItem,
  ControlGroup,
  Input,
  QueryList,
  Spinner,
  Icon,
  Icons,
} from 'construct-ui';

import app from 'state';
import { OffchainThread } from 'models';
import { SearchParams } from 'models/SearchQuery';
import { LinkedThreadRelation } from 'client/scripts/models/OffchainThread';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { formatAddressShort } from '../../../../shared/utils';

const renderThreadPreview = (state, thread: OffchainThread, idx: number) => {
  const selected = state.linkedThreads.find((lT) => +lT.id === +thread.id);
  const author = app.profiles.getProfile(thread.authorChain, thread.author);
  return m(ListItem, {
    label: m('.linked-thread-info', [
      m('.linked-thread-top', thread.title),
      m('.linked-thread-bottom', [
        author.name ? `${author.name} • ${formatAddressShort(thread.author)}` : thread.author,
      ]),
    ]),
    selected,
    key: idx,
    style: state.selectInProgress ? 'cursor: wait' : ''
  });
};

// The thread-to-thread relationship is comprised of linked and linking threads,
// i.e. child and parent nodes.

export const ThreadSelector: m.Component<
  {
    linkingThread: OffchainThread;
  },
  {
    linkedThreads: OffchainThread[];
    linkedThreadsFetched: boolean;
    showOnlyLinkedThreads: boolean;
    inputTimeout;
    searchTerm: string;
    searchResults: OffchainThread[];
    fetchingResults: boolean;
    selectInProgress: boolean;
  }
> = {
  oninit: (vnode) => {
    vnode.state.showOnlyLinkedThreads = true;
    vnode.state.searchResults = [];
    vnode.state.linkedThreads = [];
  },
  view: (vnode) => {
    const { linkingThread } = vnode.attrs;
    const { linkedThreads, linkedThreadsFetched, searchResults } = vnode.state;
    // The modal kicks off by fetching the offchain threads linked to by a given parent.
    const hasLinkedThreads = !!linkingThread.linkedThreads?.length;
    if (!hasLinkedThreads) {
      vnode.state.linkedThreadsFetched = true;
      m.redraw();
    } else if (!linkedThreadsFetched) {
      app.threads
        .fetchThreadsFromId(
          linkingThread.linkedThreads.map(
            (relation: LinkedThreadRelation) => relation.linked_thread
          )
        )
        .then((result) => {
          vnode.state.linkedThreads = result;
          vnode.state.linkedThreadsFetched = true;
          m.redraw();
        })
        .catch((err) => {
          console.error(err);
          vnode.state.linkedThreadsFetched = true;
        });
    }

    const queryLength = vnode.state.searchTerm?.trim()?.length;
    const emptyContentMessage =
      queryLength > 0 && queryLength <= 4
        ? 'Query too short'
        : queryLength > 4 && !searchResults?.length
        ? 'No threads found'
        : !vnode.state.linkedThreads?.length
        ? 'No currently linked threads'
        : null;

    return m('.ThreadSelector', [
      linkedThreadsFetched
        ? m(ControlGroup, [
            m(Input, {
              placeholder: 'Search thread titles...',
              name: 'thread-search',
              contentRight: m(Icon, {
                name: Icons.X,
                style: !queryLength && 'cursor: pointer;',
                onclick: (e) => {
                  e.stopPropagation();
                  const input = $('.ThreadSelector').find('input');
                  input.prop('value', '');
                  vnode.state.searchTerm = '';
                  vnode.state.searchResults = [];
                  vnode.state.showOnlyLinkedThreads = true;
                },
              }),
              oninput: (e) => {
                e.preventDefault();
                e.stopPropagation();
                const target = e.target as HTMLInputElement;
                clearTimeout(vnode.state.inputTimeout);
                vnode.state.searchTerm = target.value;
                vnode.state.showOnlyLinkedThreads = false;
                vnode.state.inputTimeout = setTimeout(async () => {
                  m.redraw();
                  if (target.value?.trim().length > 4) {
                    vnode.state.fetchingResults = true;
                    const params: SearchParams = {
                      chainScope: app.activeChainId(),
                      resultSize: 20,
                    };
                    app.search.searchThreadTitles(vnode.state.searchTerm, params)
                      .then((results) => {
                        vnode.state.fetchingResults = false;
                        vnode.state.searchResults = results;
                        results.forEach((thread) => {
                          app.profiles.getProfile(thread.authorChain, thread.author);
                        })
                        m.redraw();
                      })
                      .catch(() => {
                        notifyError('Could not find matching thread');
                      });
                  } else if (target.value?.length === 0) {
                    vnode.state.showOnlyLinkedThreads = true;
                  }
                }, 250);
              },
            }),
            m(QueryList, {
              filterable: false,
              checkmark: true,
              inputAttrs: {
                placeholder: 'Search for offchain thread to link...',
              },
              emptyContent: emptyContentMessage,
              items: (vnode.state.showOnlyLinkedThreads && !queryLength)
                ? linkedThreads
                : searchResults,
              itemRender: (item: OffchainThread, idx) =>
                renderThreadPreview(vnode.state, item, idx),
              onSelect: (thread: OffchainThread) => {
                const selectedThreadIdx = linkedThreads.findIndex(
                  (linkedThread) => linkedThread.id === thread.id
                );
                vnode.state.selectInProgress = true;
                if (selectedThreadIdx !== -1) {
                  app.threads
                    .removeLinkedThread(linkingThread.id, thread.id)
                    .then(() => {
                      vnode.state.linkedThreads.splice(selectedThreadIdx, 1);
                      vnode.state.selectInProgress = false;
                      notifySuccess('Thread unlinked.');
                    })
                    .catch(() => {
                      vnode.state.selectInProgress = false;
                      notifyError('Thread failed to unlink.');
                    });
                } else {
                  app.threads
                    .addLinkedThread(linkingThread.id, thread.id)
                    .then(() => {
                      vnode.state.selectInProgress = false;
                      vnode.state.linkedThreads.push(thread);
                      notifySuccess('Thread linked.');
                    })
                    .catch(() => {
                      vnode.state.selectInProgress = false;
                      notifyError('Thread failed to link.');
                    });
                }
              },
            }),
          ])
        : m('.linked-threads-selector-placeholder', [
            m('.linked-threads-selector-placeholder-text', [
              m(Spinner, {
                active: true,
                fill: true,
                message: 'Loading offchain threads...',
              }),
            ]),
          ]),
    ]);
  },
};

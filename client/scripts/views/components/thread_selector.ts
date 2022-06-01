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
import { Thread } from 'models';
import { SearchParams } from 'models/SearchQuery';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { formatAddressShort } from '../../../../shared/utils';

const renderThreadPreview = (state, thread: Thread, idx: number) => {
  const selected = state.linkedThreads.find((lT) => +lT.id === +thread.id);
  const author = app.profiles.getProfile(thread.authorChain, thread.author);
  return m(ListItem, {
    label: m('.linked-thread-info', [
      m('.linked-thread-top', thread.title),
      m('.linked-thread-bottom', [
        author.name
          ? `${author.name} • ${formatAddressShort(thread.author)}`
          : thread.author,
      ]),
    ]),
    selected,
    key: idx,
    style: state.selectInProgress ? 'cursor: wait' : '',
  });
};

// The thread-to-thread relationship is comprised of linked and linking threads,
// i.e. child and parent nodes.

export const ThreadSelector: m.Component<
  {
    linkingThread: Thread;
    linkedThreads: Thread[];
  },
  {
    linkedThreads: Thread[];
    fetchLinkedThreads: boolean;
    loading: boolean;
    showOnlyLinkedThreads: boolean;
    inputTimeout;
    searchTerm: string;
    searchResults: Thread[];
    fetchingResults: boolean;
    selectInProgress: boolean;
  }
> = {
  oninit: (vnode) => {
    vnode.state.showOnlyLinkedThreads = true;
    vnode.state.searchResults = [];
    vnode.state.linkedThreads = vnode.attrs.linkedThreads;
  },
  view: (vnode) => {
    const { linkingThread } = vnode.attrs;
    const { searchResults } = vnode.state;

    if (!vnode.state.linkedThreads) {
      vnode.state.linkedThreads = [];
    }
    const { linkedThreads } = vnode.state;

    const queryLength = vnode.state.searchTerm?.trim()?.length;

    let emptyContentMessage;
    if (queryLength > 0 && queryLength < 5) {
      emptyContentMessage = 'Query too short';
    } else if (queryLength >= 5 && !searchResults.length) {
      emptyContentMessage = 'No threads found';
    } else if (!linkedThreads?.length) {
      emptyContentMessage = 'No currently linked threads';
    }

    return m('.ThreadSelector', [
      vnode.state.loading
        ? m('.linked-threads-selector-placeholder', [
            m('.linked-threads-selector-placeholder-text', [
              m(Spinner, {
                active: true,
                fill: true,
                message: 'Loading threads...',
              }),
            ]),
          ])
        : m(ControlGroup, [
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
                  if (target.value?.trim().length > 4) {
                    vnode.state.fetchingResults = true;
                    const params: SearchParams = {
                      chainScope: app.activeChainId(),
                      resultSize: 20,
                    };
                    app.search
                      .searchThreadTitles(vnode.state.searchTerm, params)
                      .then((results) => {
                        vnode.state.fetchingResults = false;
                        vnode.state.searchResults = results;
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
                    vnode.state.showOnlyLinkedThreads = true;
                  }
                }, 250);
              },
            }),
            m(QueryList, {
              filterable: false,
              checkmark: true,
              inputAttrs: {
                placeholder: 'Search for thread to link...',
              },
              emptyContent: emptyContentMessage,
              items:
                vnode.state.showOnlyLinkedThreads && !queryLength
                  ? linkedThreads
                  : searchResults,
              itemRender: (item: Thread, idx) =>
                renderThreadPreview(vnode.state, item, idx),
              onSelect: (thread: Thread) => {
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
          ]),
    ]);
  },
};

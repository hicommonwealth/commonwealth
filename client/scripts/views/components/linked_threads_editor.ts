import 'components/linked_threads_editor.scss';

import m from 'mithril';
import {
  ListItem,
  ControlGroup,
  Input,
  List,
  QueryList,
  Spinner,
  Size,
  Button,
} from 'construct-ui';

import app from 'state';
import { OffchainThread } from 'models';
import { ILinkedThread } from 'client/scripts/models/OffchainThread';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { searchThreadTitles } from 'helpers/search';
import { SearchParams } from './search_bar';

const renderThreadPreview = (state, thread: OffchainThread, idx: number) => {
  const selected = state.linkedThreads.find((lT) => +lT.id === +thread.id);
  console.log(thread);
  return m(ListItem, {
    label: m('.linked-thread-info', [
      m('.linked-thread-top', thread.title),
      m('.linked-thread-bottom', thread.author),
    ]),
    selected,
    key: idx,
  });
};

export const ThreadsSelector: m.Component<
  {
    linkingThread: OffchainThread;
    onSelect?;
  },
  {
    searchTerm: string;
    inputTimeout;
    fetchingResults: boolean;
    searchResults: OffchainThread[];
    linkedThreads: OffchainThread[];
    linkedThreadsFetched: boolean;
    showOnlyLinkedThreads: boolean;
    selectedThreadId: number;
  }
> = {
  oninit: (vnode) => {
    vnode.state.showOnlyLinkedThreads = true;
    vnode.state.searchResults = [];
    vnode.state.linkedThreads = [];
    if (!vnode.attrs.linkingThread.linkedThreads?.length) {
      vnode.state.linkedThreadsFetched = true;
    }
  },
  view: (vnode) => {
    const { linkingThread } = vnode.attrs;
    const { linkedThreads, linkedThreadsFetched, searchResults } = vnode.state;
    const hasLinkedThreads = linkingThread.linkedThreads?.length;
    if (hasLinkedThreads && !linkedThreadsFetched) {
      app.threads
        .fetchThreadsFromId(
          linkingThread.linkedThreads.map(
            (lt: ILinkedThread) => lt.linked_thread
          )
        )
        .then((res) => {
          vnode.state.linkedThreads = res;
          vnode.state.linkedThreadsFetched = true;
          m.redraw();
        })
        .catch((err) => {
          vnode.state.linkedThreads = [];
          vnode.state.linkedThreadsFetched = true;
        });
    }
    console.log({ state: vnode.state });
    console.log({ searchResults, linkedThreads });
    const queryLength = vnode.state.searchTerm?.trim()?.length;
    const emptyContentMessage =
      queryLength > 0 && queryLength < 4
        ? 'Query too short'
        : !hasLinkedThreads
        ? 'No currently linked threads'
        : searchResults?.length === 0
        ? 'No threads found'
        : null;

    console.log({ emptyContentMessage });
    return m('.ThreadsSelector', [
      linkedThreadsFetched
        ? m(ControlGroup, [
            m(Input, {
              placeholder: 'Search thread titles...',
              oninput: (e) => {
                e.preventDefault();
                e.stopPropagation();
                const target = e.target as HTMLInputElement;
                clearTimeout(vnode.state.inputTimeout);
                vnode.state.inputTimeout = setTimeout(async () => {
                  vnode.state.searchTerm = target.value;
                  m.redraw();
                  if (target.value?.trim().length > 4) {
                    vnode.state.fetchingResults = true;
                    const params: SearchParams = {
                      chainScope: app.activeChainId(),
                      communityScope: app.activeCommunityId(),
                      resultSize: 20,
                    };
                    searchThreadTitles(vnode.state.searchTerm, params)
                      .then((result) => {
                        vnode.state.fetchingResults = false;
                        vnode.state.showOnlyLinkedThreads = false;
                        vnode.state.searchResults = result;
                        m.redraw();
                      })
                      .catch((err) => {
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
              items: vnode.state.showOnlyLinkedThreads
                ? linkedThreads
                : searchResults,
              itemRender: (item: OffchainThread, idx) =>
                renderThreadPreview(vnode.state, item, idx),
              onSelect: (thread: OffchainThread) => {
                const selectedThreadIdx = linkedThreads.findIndex(
                  (linkedThread) => linkedThread.id === thread.id
                );
                if (selectedThreadIdx !== -1) {
                  app.threads
                    .removeLinkedThread(linkingThread.id, thread.id)
                    .then((result) => {
                      vnode.state.linkedThreads.splice(selectedThreadIdx, 1);
                      notifySuccess('Thread unlinked.');
                    })
                    .catch((err) => {
                      notifyError('Thread failed to unlink.');
                    });
                } else {
                  app.threads
                    .addLinkedThread(linkingThread.id, thread.id)
                    .then((result) => {
                      vnode.state.linkedThreads.push(thread);
                      notifySuccess('Thread linked.');
                    })
                    .catch((err) => {
                      notifyError('Thread failed to link.');
                    });
                }
              },
            }),
          ])
        : m('.linked-threads-selector-placeholder', [
            m('.linked-threads-selector-placeholder-text', [
              vnode.state.linkedThreadsFetched
                ? 'Select offchain threads to add.'
                : m(Spinner, {
                    active: true,
                    fill: true,
                    message: 'Loading offchain threads...',
                  }),
            ]),
          ]),
    ]);
  },
};

import 'components/linked_threads_editor.scss';

import m from 'mithril';
import { ListItem, ControlGroup, Input, List, QueryList, Spinner, Size } from 'construct-ui';

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
}

export const ThreadsSelector: m.Component<{
  linkingThread: OffchainThread;
  onSelect?,
}, {
  searchTerm: string;
  inputTimeout;
  isSearching: boolean;
  searchResults: OffchainThread[];
  linkedThreads: OffchainThread[];
  linkedThreadsFetched: boolean;
  displayInitialContent: boolean;
  selectedThreadId: number;
}> = {
  oninit: (vnode) => {
    vnode.state.displayInitialContent = true;
    vnode.state.searchResults = [];
  },
  view: (vnode) => {
    const { linkingThread } = vnode.attrs;
    const { linkedThreads, linkedThreadsFetched, searchResults  } = vnode.state;
    if (linkingThread.linkedThreads?.length && !linkedThreadsFetched) {
      app.threads.fetchThreadsFromId(
        linkingThread.linkedThreads.map((lt: ILinkedThread) => lt.linked_thread)
      ).then((res)=> {
        vnode.state.linkedThreads = res;
        vnode.state.linkedThreadsFetched = true;
        m.redraw();
      });
    }

    console.log({ searchResults });
    return m('.ThreadsSelector', [
      linkedThreadsFetched
      ? m(ControlGroup, [
        m(Input, {
          placeholder: 'Search thread titles...',
          oninput: (e) => {
            e.preventDefault();
            e.stopPropagation();
            const target = e.target as HTMLInputElement;
            console.log({ target });
            if (target.value?.length > 4) {
              console.log('> 4')
              vnode.state.displayInitialContent = false;
              vnode.state.isSearching = true;
              console.log(vnode.state.isSearching);
              const params: SearchParams = {
                chainScope: app.activeChainId(),
                communityScope: app.activeCommunityId(),
                resultSize: 10,
              };
              clearTimeout(vnode.state.inputTimeout);
              vnode.state.inputTimeout = setTimeout(async () => {
                vnode.state.searchTerm = target.value;
                searchThreadTitles(
                  vnode.state.searchTerm,
                  params
                ).then((result) => {
                  vnode.state.isSearching = false;
                  vnode.state.searchResults = result;
                  m.redraw();
                }).catch((err) => {
                  notifyError('Could not find matching thread');
                });
              }, 100);
            } else {
              vnode.state.displayInitialContent = true;
            }
          },
        }),
        // vnode.state.isSearching
        //   && m(Spinner, { active: true, size: Size.LG }),
        m(QueryList, {
          filterable: false,
          checkmark: true,
          inputAttrs: {
            placeholder: 'Search for offchain thread to link...',
          },
          emptyContent: m('.empty-content-wrap', [
            vnode.state.isSearching
              ? m(Spinner, { active: true, size: Size.LG })
              : 'No threads found.'
          ]),
          items: vnode.state.displayInitialContent
            ? linkedThreads
            : searchResults,
          itemRender: (item: OffchainThread, idx) => renderThreadPreview(vnode.state, item, idx),
          onSelect: (thread: OffchainThread) => {
            const selectedThreadIdx = linkedThreads.findIndex((linkedThread) => linkedThread.id === thread.id);
            if (selectedThreadIdx !== -1) {
              app.threads.removeLinkedThread(linkingThread.id, thread.id)
                .then((result) => {
                  vnode.state.linkedThreads.splice(selectedThreadIdx, 1);
                    notifySuccess('Thread unlinked.')
                })
                .catch((err) => {
                    notifyError('Thread failed to unlink.')
                });
            } else {
              app.threads.addLinkedThread(linkingThread.id, thread.id)
              .then((result) => {
                vnode.state.linkedThreads.push(thread);
                notifySuccess('Thread linked.')
              })
              .catch((err) => {
                notifyError('Thread failed to link.')
              });
            }
          },
        })
      ])
      : m('.linked-threads-selector-placeholder', [
        m('.linked-threads-selector-placeholder-text', [
          vnode.state.linkedThreadsFetched
            ? 'Select offchain threads.'
            : m(Spinner, { active: true, fill: true, message: 'Loading offchain threads...' }),

        ]),
      ]),
    ]);
  }
};

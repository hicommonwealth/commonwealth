import 'modals/offchain_voting_modal.scss';

import m from 'mithril';
import app from 'state';
import { OffchainThread } from 'models';
import { Button, Input, Spinner } from 'construct-ui';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { searchThreadTitles } from 'helpers/search';
import { OffchainThreadInstance } from 'server/models/offchain_thread';
import { modelFromServer } from 'controllers/server/threads';
import { ILinkedThread } from 'client/scripts/models/OffchainThread';
import { CompactModalExitButton } from '../modal';
import { SearchParams } from '../components/search_bar';
import DiscussionRow from '../pages/discussions/discussion_row';
import LinkedThreadsEditor from '../components/linked_threads_editor';

const LinkThreadToThreadModal: m.Component<
  { linkingThread: OffchainThread },
  {
  }
> = {
  view: (vnode) => {
    const { linkingThread } = vnode.attrs;
    return m('.LinkThreadToThreadModal', [
      m('.compact-modal-title', [
        m('h3', 'Link to Existing Threads'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body', [
        m(LinkedThreadsEditor, {
          linkingThread
        })
        // m('h4', 'Linked threads'),
        // linkedThreadsFetched
        // ? m('.linked-threads', linkedThreads.map((linkedThread) => {
        //     return m(DiscussionRow, {
        //       proposal: linkedThread,
        //       onSelect: () => {
        //         app.threads.removeLinkedThread(
        //           linkedThread.id,
        //           linkingProposal
        //         ).then((updatedLinkedThreads: OffchainThread[]) => {
        //           console.log({ updatedLinkedThreads });
        //           notifySuccess('Thread successfully removed');
        //           vnode.state.linkedThreads = updatedLinkedThreads;
        //           m.redraw();
        //         }).catch((err) => {
        //           notifyError('Failed to remove linked thread');
        //         });
        //       }
        //     })
        // }))
        // : m(Spinner, { active: true, fill: true }),
        // m('h4', 'Search offchain threads to add...'),
        // m(Input, {
        //   label: 'Search thread titles...',
        //   oninput: (e) => {
        //     if (e.target.value?.length > 4) {
        //       const params: SearchParams = {
        //         chainScope: app.activeChainId(),
        //         communityScope: app.activeCommunityId(),
        //         resultSize: 10,
        //       };
        //       clearTimeout(vnode.state.inputTimeout);
        //       vnode.state.inputTimeout = setTimeout(async () => {
        //         vnode.state.searchTerm = e.target.value;
        //         searchThreadTitles(
        //           vnode.state.searchTerm,
        //           params
        //         ).then((result) => {
        //           vnode.state.searchResults = result;
        //           m.redraw();
        //         }).catch((err) => {
        //           notifyError('Could not find matching thread');
        //         });
        //       }, 500);
        //     }
        //   },
        // }),
        // vnode.state.searchResults?.length > 0 &&
        //   vnode.state.searchResults.map((thread: OffchainThreadInstance) => {
        //     const processedThread = modelFromServer(thread);
        //     return m(DiscussionRow, {
        //       proposal: processedThread,
        //       onSelect: () => {
        //         app.threads.addLinkedThread(
        //           thread.id,
        //           linkingProposal
        //         ).then((updatedLinkedThreads: OffchainThread[]) => {
        //           console.log({ updatedLinkedThreads });
        //           notifySuccess('Thread successfully linked');
        //           vnode.state.searchTerm = '';
        //           const input = $('.LinkThreadToThreadModal').find('input[name=search');
        //           input.val('');
        //           vnode.state.searchResults = [];
        //           vnode.state.linkedThreads = updatedLinkedThreads;
        //           m.redraw();
        //         }).catch((err) => {
        //           notifyError('Thread failed to link');
        //         });
        //       }
        //     });
        //   }),
      ]),
    ]);
  },
};

export default LinkThreadToThreadModal;

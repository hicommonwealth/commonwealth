import 'modals/offchain_voting_modal.scss';

import m from 'mithril';
import { OffchainThread } from 'models';
import { CompactModalExitButton } from '../modal';
import { ThreadsSelector } from '../components/linked_threads_editor';

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
        m(ThreadsSelector, {
          linkingThread,
        }),
        // m(LinkedThreadsEditor, {
        //   linkingThread
        // })
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
      ]),
    ]);
  },
};

export default LinkThreadToThreadModal;
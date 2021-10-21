import 'modals/offchain_voting_modal.scss';

import m from 'mithril';
import app from 'state';
import { OffchainThread } from 'models';
import { Button, Input } from 'construct-ui';
import { notifyError } from 'controllers/app/notifications';
import { searchThreadTitles } from 'helpers/search';
import { OffchainThreadInstance } from 'server/models/offchain_thread';
import { modelFromServer } from 'controllers/server/threads';
import { CompactModalExitButton } from '../modal';
import { SearchParams } from '../components/search_bar';
import DiscussionRow from '../pages/discussions/discussion_row';

const LinkThreadToThreadModal: m.Component<
  { linkingProposal: OffchainThread },
  {
    searchTerm: string;
    inputTimeout: any;
    searchResults: OffchainThreadInstance[];
  }
> = {
  view: (vnode) => {
    const { linkingProposal } = vnode.attrs;
    return m('.LinkThreadToThreadModal', [
      m('.compact-modal-title', [
        m('h3', 'Link to Existing Threads'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body', [
        m('h3', 'Offchain Threads'),
        m(Input, {
          label: 'Search thread titles...',
          oninput: (e) => {
            if (e.target.value?.length > 5) {
              const params: SearchParams = {
                chainScope: app.activeChainId(),
                communityScope: app.activeCommunityId(),
                resultSize: 10,
              };
              clearTimeout(vnode.state.inputTimeout);
              vnode.state.inputTimeout = setTimeout(async () => {
                vnode.state.searchTerm = e.target.value;
                vnode.state.searchResults = await searchThreadTitles(
                  vnode.state.searchTerm,
                  params
                );
                console.log(vnode.state.searchResults);
                m.redraw();
              }, 500);
            }
          },
        }),
        vnode.state.searchResults?.length > 0 &&
          vnode.state.searchResults.map((thread: OffchainThreadInstance) => {
            const processedThread = modelFromServer(thread);
            return m(DiscussionRow, {
              proposal: processedThread,
              showExcerpt: true,
            });
          }),
        // m(Button, {
        //   label: 'Add',
        //   onclick: (e) => {
        //     console.log(vnode.state.searchTerm);
        //     app.threads.addLinkedThread(
        //       vnode.state.searchTerm,
        //       linkingProposal
        //     );
        //   },
        // }),
      ]),
    ]);
  },
};

export default LinkThreadToThreadModal;

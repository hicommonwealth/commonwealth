import 'components/stage_editor.scss';

import m from 'mithril';
import { QueryList, ListItem, Button, Classes, Dialog } from 'construct-ui';

import app from 'state';
import { OffchainThread, OffchainThreadStage } from 'models';
import { OffchainThreadInstance } from 'server/models/offchain_thread';
import { ILinkedThread } from 'client/scripts/models/OffchainThread';

export const ThreadsSelector: m.Component<{
  linkingThread: OffchainThread;
  onSelect?,
}, {
  searchTerm: string;
  inputTimeout;
  searchResults: OffchainThreadInstance[];
  linkedThreads: OffchainThread[];
  linkedThreadsFetched: boolean;
  threadsToLink: number[];
}> = {
  view: (vnode) => {
    const { onSelect, linkingThread } = vnode.attrs;
    const { linkedThreads, linkedThreadsFetched, searchTerm, inputTimeout, searchResults  } = vnode.state;
    if (linkingThread.linkedThreads?.length && !linkedThreadsFetched) {
      app.threads.fetchThreadsFromId(
        linkingThread.linkedThreads.map((lt: ILinkedThread) => lt.linked_thread)
      ).then((res)=> {
        vnode.state.linkedThreads = res;
        vnode.state.linkedThreadsFetched = true;
        console.log(res);
        m.redraw();
      });
    }
    if (!vnode.state.threadsToLink) {
      vnode.state.threadsToLink = [];
    }

    return m('.ThreadsSelector', [
      linkedThreadsFetched
      ? m(QueryList, {
        checkmark: true,
        items: linkedThreads,
        inputAttrs: {
          placeholder: 'Search for offchain thread to link...',
        },
        itemRender: (linkedThread: OffchainThread, idx: number) => {
          const selected = vnode.state.threadsToLink?.indexOf(linkedThread.id) !== -1;
          return m(ListItem, {
            label: m('.chain-entity-info', [
              m('.chain-entity-top', linkedThread.title),
              m('.chain-entity-bottom', linkedThread.author),
            ]),
            selected,
            key: linkedThread.id,
          });
        },
        // itemPredicate: (query, ce: ChainEntity, idx) => {
        //   if (ce.typeId.startsWith('0x')) {
        //     return false;
        //   } else {
        //     return ce.typeId.toString().toLowerCase().includes(query.toLowerCase())
        //       || ce.title?.toString().toLowerCase().includes(query.toLowerCase())
        //       || chainEntityTypeToProposalName(ce.type).toLowerCase().includes(query.toLowerCase());
        //   }
        // },
        onSelect: (linkedThread: OffchainThread) => {
          if (vnode.state.threadsToLink.indexOf(linkedThread.id) !== -1) {
            const index = vnode.state.threadsToLink.findIndex((ttl) => ttl === linkedThread.id);
            vnode.state.threadsToLink.splice(index, 1);
          } else {
            vnode.state.threadsToLink.push(linkedThread.id);
          }
        },
      }) : m('.chain-entities-selector-placeholder', [
        m('.chain-entities-selector-placeholder-text', [
          vnode.state.linkedThreadsFetched
            ? 'Select offchain threads.'
            : 'Loading offchain threads...'
        ]),
      ]),
    ]);
  }
};

const LinkedThreadsEditor: m.Component<{
  linkingThread: OffchainThread;
}, {
  stage: OffchainThreadStage;
  isOpen: boolean;
}> = {
  view: (vnode) => {
    const { linkingThread } = vnode.attrs;
    return m('.LinkedThreadsEditor', [
      m(Dialog, {
        basic: false,
        closeOnEscapeKey: true,
        closeOnOutsideClick: true,
        class: 'LinkedThreadsEditorDialog',
        content: [
          
        ],
        hasBackdrop: true,
        isOpen: true,
        inline: false,
        title: 'Update proposal status',
        transitionDuration: 200,
        footer: m(`.${Classes.ALIGN_RIGHT}`, [
          m(Button, {
            label: 'Cancel',
            rounded: true,
          }),
          m(Button, {
            label: 'Save changes',
            intent: 'primary',
            rounded: true,
            onclick: async () => {
              // const { stage } = vnode.state;
              // const { thread } = vnode.attrs;

              // // set stage
              // try {
              //   await app.threads.setStage({ threadId: thread.id, stage: vnode.state.stage });
              // } catch (err) {
              //   console.log('Failed to update stage');
              //   throw new Error((err.responseJSON && err.responseJSON.error)
              //     ?  `${err.responseJSON.error}. Make sure one is selected.`
              //     : 'Failed to update stage, make sure one is selected');
              // }

              // // set linked chain entities
              // try {
              //   await app.threads.setLinkedChainEntities({ threadId: thread.id, entities: vnode.state.chainEntitiesToSet });
              //   await app.threads.setLinkedSnapshotProposal({ threadId: thread.id, 
              //     snapshotProposal: vnode.state.snapshotProposalsToSet[0]?.id })
              // } catch (err) {
              //   console.log('Failed to update linked proposals');
              //   throw new Error((err.responseJSON && err.responseJSON.error)
              //     ? err.responseJSON.error
              //     : 'Failed to update linked proposals');
              // }

              // // TODO: add set linked snapshot proposals
              // vnode.attrs.onChangeHandler(vnode.state.stage, vnode.state.chainEntitiesToSet, vnode.state.snapshotProposalsToSet);

              // if (vnode.attrs.popoverMenu) {
              //   vnode.attrs.openStateHandler(false);
              // } else {
              //   vnode.state.isOpen = false;
              // }
            },
          }),
        ])
      })
    ]);
  }
};

export default LinkedThreadsEditor;

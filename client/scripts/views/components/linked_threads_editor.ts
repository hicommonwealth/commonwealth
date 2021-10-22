import 'components/stage_editor.scss';

import m from 'mithril';
import { uuidv4 } from 'lib/util';
import { QueryList, ListItem, Button, Classes, Dialog, Icons } from 'construct-ui';

import app from 'state';
import { offchainThreadStageToLabel, parseCustomStages } from 'helpers';
import { ChainEntity, OffchainThread, OffchainThreadStage } from 'models';
import { chainEntityTypeToProposalName } from 'identifiers';
import { EntityRefreshOption } from 'controllers/server/chain_entities';
import { SnapshotProposal } from 'helpers/snapshot_utils';
import { OffchainThreadInstance } from 'server/models/offchain_thread';
import { ILinkedThread } from 'client/scripts/models/OffchainThread';

// const SnapshotProposalSelector: m.Component<{
//   thread: OffchainThread;
//   onSelect,
//   snapshotProposalsToSet: SnapshotProposal[];
// }, {
//   initialized: boolean;
//   snapshotProposalsLoaded: boolean;
// }> = {
//   view: (vnode) => {
//     const { thread, onSelect } = vnode.attrs;
//     if (!app.chain || !app.activeChainId()) return;
//     if (!vnode.state.initialized) {
//       vnode.state.initialized = true;
//       if (app.chain.meta.chain.snapshot) {
//         if (!app.snapshot.initialized) {
//           app.snapshot.init(app.chain.meta.chain.snapshot).then(() => {
//             // refreshing loads the latest snapshot proposals into app.snapshot.proposals array
//             vnode.state.snapshotProposalsLoaded = true;
//             m.redraw();
//           })
//         } else {
//           app.snapshot.refreshProposals().then(() => {
//             vnode.state.snapshotProposalsLoaded = true;
//             m.redraw();
//           })
//         };
//       }
//     }

//     return m('.ChainEntitiesSelector', [
//       vnode.state.snapshotProposalsLoaded ? m(QueryList, {
//         checkmark: true,
//         items: app.snapshot.proposals.sort((a, b) => {
//           return b.created - a.created;
//         }),
//         inputAttrs: {
//           placeholder: 'Search for an existing snapshot proposal...',
//         },
//         itemRender: (sn: SnapshotProposal, idx: number) => {
//           const selected = vnode.attrs.snapshotProposalsToSet.map((sn_) => sn_.created).indexOf(sn.created) !== -1;
//           // TODO: show additional info on the ListItem, like any set proposal title, the creator, or other metadata
//           return m(ListItem, {
//             label: m('.chain-entity-info', [
//               m('.chain-entity-top', `${sn.title.slice(0,60)}...`),
//               m('.chain-entity-bottom', `Hash: ${sn.id}`),
//             ]),
//             selected,
//             key: sn.id,
//           });
//         },
//         itemPredicate: (query, sn: SnapshotProposal, idx) => {
//           // TODO
//           return sn.title?.toString().toLowerCase().includes(query.toLowerCase())
//         },
//         onSelect: (sn: SnapshotProposal) => {
//           // TODO
//           if (vnode.attrs.snapshotProposalsToSet.map((sn_) => sn_.created).indexOf(sn.created) !== -1) {
//             const index = vnode.attrs.snapshotProposalsToSet.findIndex((sn_) => sn_.id === sn.id);
//             vnode.attrs.snapshotProposalsToSet.splice(index, 1);
//           } else {
//             vnode.attrs.snapshotProposalsToSet.push(sn);
//           }
//           onSelect(sn);
//         },
//       }) : m('.chain-entities-selector-placeholder', [
//         m('.chain-entities-selector-placeholder-text', [
//           vnode.state.snapshotProposalsLoaded
//             ? 'TODO: how to begin?'
//             : 'Loading snapshot proposals...'
//         ]),
//       ]),
//     ]);
//   }
// };

const ThreadsSelector: m.Component<{
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

    return m('.ThreadsSelector', [
      linkedThreadsFetched
      ? m(QueryList, {
        checkmark: true,
        items: linkedThreads,
        inputAttrs: {
          placeholder: 'Search for offchain thread to link...',
        },
        itemRender: (linkedThread: OffchainThread, idx: number) => {
          const selected = vnode.state.threadsToLink.indexOf(linkedThread.id) !== -1;
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
          onSelect(linkedThread);
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
    const { isOpen } = vnode.state;
    return m('.LinkedThreadsEditor', [
      m('a', {
        href: '#',
        onclick: (e) => { e.preventDefault(); vnode.state.isOpen = true; },
      }, 'Edit stage'),
      m(Dialog, {
        basic: false,
        closeOnEscapeKey: true,
        closeOnOutsideClick: true,
        class: 'LinkedThreadsEditorDialog',
        content: [
          m(ThreadsSelector, {
            linkingThread,
          }),
        ],
        hasBackdrop: true,
        isOpen,
        inline: false,
        onClose: () => {
          vnode.state.isOpen = false;
        },
        title: 'Update proposal status',
        transitionDuration: 200,
        footer: m(`.${Classes.ALIGN_RIGHT}`, [
          m(Button, {
            label: 'Cancel',
            rounded: true,
            onclick: () => {
              vnode.state.isOpen = false;
            },
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

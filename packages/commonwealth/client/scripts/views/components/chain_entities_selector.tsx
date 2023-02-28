import React from 'react';

import { render } from 'mithrilInterop';

import 'components/chain_entities_selector.scss';
import type { ChainEntity, Thread } from 'models';

import app from 'state';

type ChainEntitiesSelectorProps = {
  chainEntitiesToSet: Array<ChainEntity>;
  onSelect: (ce: ChainEntity) => void;
  thread: Thread;
};

export const ChainEntitiesSelector = (props: ChainEntitiesSelectorProps) => {
  const { thread, onSelect } = props;

  const [chainEntitiesLoaded, setChainEntitiesLoaded] =
    React.useState<boolean>(false);
  const [initialized, setInitialized] = React.useState<boolean>(false);

  if (!app.chain || !app.activeChainId()) return;

  if (!initialized) {
    setInitialized(true);
    app.chainEntities?.refresh(app.chain.id).then(() => {
      // refreshing loads the latest chain entities into app.chainEntities store
      setChainEntitiesLoaded(true);
    });
  }

  return (
    <div className="ChainEntitiesSelector">
      {chainEntitiesLoaded ? (
        render('@TODO: @REACT pleaseremoveme')
      ) : (
        // m(QueryList, {
        //   checkmark: true,
        //   items: app.chainEntities.store.getAll().sort((a, b) => {
        //     if (!a.threadId && b.threadId) return -1;
        //     if (a.threadId && !b.threadId) return 1;
        //     return 0;
        //   }),
        //   inputAttrs: {
        //     placeholder: 'Search for an existing proposal...',
        //   },
        //   itemRender: (ce: ChainEntity) => {
        //     const selected =
        //       vnode.attrs.chainEntitiesToSet
        //         .map((ce_) => ce_.id)
        //         .indexOf(ce.id) !== -1;
        //     // TODO: show additional info on the ListItem,
        //     // like any set proposal title, the creator, or other metadata
        //     return m(ListItem, {
        //       disabled: ce.threadId && ce.threadId !== thread.id,
        //       label: (
        //         <div className="chain-entity">
        //           <div className="chain-entity-text">
        //             {chainEntityTypeToProposalName(ce.type) +
        //               (ce.typeId.startsWith('0x')
        //                 ? ` ${ce.typeId.slice(0, 6)}...`
        //                 : ` #${ce.typeId}`)}
        //           </div>
        //           <div className="chain-entity-subtext">
        //             {ce.threadTitle !== 'undefined'
        //               ? decodeURIComponent(ce.threadTitle)
        //               : 'No thread title'}
        //           </div>
        //         </div>
        //       ),
        //       selected,
        //       key: ce.id ? ce.id : uuidv4(),
        //     });
        //   },
        //   itemPredicate: (query, ce: ChainEntity) => {
        //     if (ce.typeId.startsWith('0x')) {
        //       return false;
        //     } else {
        //       return (
        //         ce.typeId
        //           .toString()
        //           .toLowerCase()
        //           .includes(query.toLowerCase()) ||
        //         ce.title
        //           ?.toString()
        //           .toLowerCase()
        //           .includes(query.toLowerCase()) ||
        //         chainEntityTypeToProposalName(ce.type)
        //           .toLowerCase()
        //           .includes(query.toLowerCase())
        //       );
        //     }
        //   },
        //   onSelect: (ce: ChainEntity) => {
        //     if (
        //       vnode.attrs.chainEntitiesToSet
        //         .map((ce_) => ce_.id)
        //         .indexOf(ce.id) !== -1
        //     ) {
        //       const index = vnode.attrs.chainEntitiesToSet.findIndex(
        //         (ce_) => ce_.id === ce.id
        //       );
        //       vnode.attrs.chainEntitiesToSet.splice(index, 1);
        //     } else {
        //       vnode.attrs.chainEntitiesToSet.push(ce);
        //     }
        //     onSelect(ce);
        //   },
        // })
        <div className="loading-container">
          <div className="loading-text">
            {chainEntitiesLoaded
              ? 'Select "In Voting" to begin.'
              : 'Loading on-chain proposals...'}
          </div>
        </div>
      )}
    </div>
  );
};

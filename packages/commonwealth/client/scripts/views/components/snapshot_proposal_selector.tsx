import React from 'react';

import 'components/snapshot_proposal_selector.scss';
import type { SnapshotProposal } from 'helpers/snapshot_utils';
import { loadMultipleSpacesData } from 'helpers/snapshot_utils';
import type { Thread } from 'models';

import app from 'state';

type SnapshotProposalSelectorProps = {
  onSelect: (sn: SnapshotProposal) => void;
  snapshotProposalsToSet: SnapshotProposal[];
  thread: Thread;
};

export const SnapshotProposalSelector = (
  props: SnapshotProposalSelectorProps
) => {
  const { onSelect } = props;

  const [allProposals, setAllProposals] = React.useState<
    Array<SnapshotProposal>
  >([]);
  const [snapshotProposalsLoaded, setSnapshotProposalsLoaded] =
    React.useState<boolean>(false);

  if (!app.chain || !app.activeChainId()) return;

  if (setAllProposals.length === 0) {
    loadMultipleSpacesData(app.chain.meta.snapshot).then((data) => {
      for (const { proposals } of data) {
        setAllProposals([...allProposals, ...proposals]);
      }

      setSnapshotProposalsLoaded(true);
    });
  }

  return (
    <div className="SnapshotProposalSelector">
      {
        // snapshotProposalsLoaded ? (
        // render('@TODO @REACT please remove me')
        // ) : (
        // m(QueryList, {
        //   checkmark: true,
        //   items: allProposals.sort((a, b) => {
        //     return b.created - a.created;
        //   }),
        //   inputAttrs: {
        //     placeholder: 'Search for an existing snapshot proposal...',
        //   },
        //   itemRender: (sn: SnapshotProposal) => {
        //     const selected = sn.id === vnode.attrs.thread.snapshotProposal;
        //     // TODO: show additional info on the ListItem,
        //     // like any set proposal title, the creator, or other metadata
        //     return m(ListItem, {
        //       label: (
        //         <div className="chain-entity">
        //           <div className="chain-entity-text" title={sn.title}>
        //             {sn.title}
        //           </div>
        //           <div className="chain-entity-subtext" title={sn.id}>
        //             Hash: ${sn.id}
        //           </div>
        //         </div>
        //       ),
        //       selected,
        //       key: sn.id,
        //     });
        //   },
        //   itemPredicate: (query, sn: SnapshotProposal) => {
        //     // TODO
        //     return sn.title
        //       ?.toString()
        //       .toLowerCase()
        //       .includes(query.toLowerCase());
        //   },
        //   onSelect: (sn: SnapshotProposal) => {
        //     onSelect(sn);
        //   },
        // })
        <div className="loading-container">
          <div className="loading-text">
            {snapshotProposalsLoaded
              ? 'TODO: how to begin?'
              : 'Loading snapshot proposals...'}
          </div>
        </div>
        // )
      }
    </div>
  );
};

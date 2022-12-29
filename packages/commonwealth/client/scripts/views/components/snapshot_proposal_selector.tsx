/* @jsx jsx */


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'components/snapshot_proposal_selector.scss';

import app from 'state';
import { Thread } from 'models';
import {
  loadMultipleSpacesData,
  SnapshotProposal,
} from 'helpers/snapshot_utils';

type SnapshotProposalSelectorAttrs = {
  onSelect: (sn: SnapshotProposal) => void;
  snapshotProposalsToSet: SnapshotProposal[];
  thread: Thread;
};

export class SnapshotProposalSelector extends ClassComponent<SnapshotProposalSelectorAttrs> {
  private allProposals: SnapshotProposal[];
  private initialized: boolean;
  private snapshotProposalsLoaded: boolean;

  view(vnode: ResultNode<SnapshotProposalSelectorAttrs>) {
    const { onSelect } = vnode.attrs;

    if (!app.chain || !app.activeChainId()) return;

    if (!this.initialized) {
      this.allProposals = [];
      this.initialized = true;

      loadMultipleSpacesData(app.chain.meta.snapshot).then((data) => {
        for (const { proposals } of data) {
          this.allProposals = [...this.allProposals, ...proposals];
        }

        this.snapshotProposalsLoaded = true;
        redraw();
      });
    }

    return (
      <div className="SnapshotProposalSelector">
        {this.snapshotProposalsLoaded ? (
          render('@TODO @REACT please remove me')
          // m(QueryList, {
          //   checkmark: true,
          //   items: this.allProposals.sort((a, b) => {
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
        ) : (
          <div className="loading-container">
            <div className="loading-text">
              {this.snapshotProposalsLoaded
                ? 'TODO: how to begin?'
                : 'Loading snapshot proposals...'}
            </div>
          </div>
        )}
      </div>
    );
  }
}

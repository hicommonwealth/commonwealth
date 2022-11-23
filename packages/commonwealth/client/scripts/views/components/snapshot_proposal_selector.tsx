/* @jsx m */

import m from 'mithril';
import { QueryList, ListItem } from 'construct-ui';

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

export class SnapshotProposalSelector
  implements m.ClassComponent<SnapshotProposalSelectorAttrs>
{
  private allProposals: SnapshotProposal[];
  private initialized: boolean;
  private snapshotProposalsLoaded: boolean;

  view(vnode: m.Vnode<SnapshotProposalSelectorAttrs>) {
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
        m.redraw();
      });
    }

    return (
      <div class="SnapshotProposalSelector">
        {this.snapshotProposalsLoaded ? (
          m(QueryList, {
            checkmark: true,
            items: this.allProposals.sort((a, b) => {
              return b.created - a.created;
            }),
            inputAttrs: {
              placeholder: 'Search for an existing snapshot proposal...',
            },
            itemRender: (sn: SnapshotProposal) => {
              const selected = sn.id === vnode.attrs.thread.snapshotProposal;
              // TODO: show additional info on the ListItem,
              // like any set proposal title, the creator, or other metadata
              return m(ListItem, {
                label: (
                  <div class="chain-entity">
                    <div class="chain-entity-text" title={sn.title}>
                      {sn.title}
                    </div>
                    <div class="chain-entity-subtext" title={sn.id}>
                      Hash: ${sn.id}
                    </div>
                  </div>
                ),
                selected,
                key: sn.id,
              });
            },
            itemPredicate: (query, sn: SnapshotProposal) => {
              // TODO
              return sn.title
                ?.toString()
                .toLowerCase()
                .includes(query.toLowerCase());
            },
            onSelect: (sn: SnapshotProposal) => {
              onSelect(sn);
            },
          })
        ) : (
          <div class="loading-container">
            <div class="loading-text">
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

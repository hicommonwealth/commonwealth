/* @jsx m */

import m from 'mithril';
import { QueryList, ListItem } from 'construct-ui';

import 'components/snapshot_proposal_selector.scss';

import app from 'state';
import { OffchainThread } from 'models';
import {
  loadMultipleSpacesData,
  SnapshotProposal,
} from 'helpers/snapshot_utils';

type SnapshotProposalSelectorAttrs = {
  onSelect: () => void;
  snapshotProposalsToSet: SnapshotProposal[];
  thread: OffchainThread;
};

export class SnapshotProposalSelector
  implements m.ClassComponent<SnapshotProposalSelectorAttrs>
{
  private all_proposals: SnapshotProposal[];
  private initialized: boolean;
  private snapshotProposalsLoaded: boolean;

  view(vnode) {
    const { onSelect } = vnode.attrs;

    if (!app.chain || !app.activeChainId()) return;

    if (!this.initialized) {
      this.all_proposals = [];
      this.initialized = true;

      loadMultipleSpacesData(app.chain.meta.chain.snapshot).then((data) => {
        for (const { proposals } of data) {
          this.all_proposals = [...this.all_proposals, ...proposals];
        }

        this.snapshotProposalsLoaded = true;
        m.redraw();
      });
    }

    return (
      <div class="SnapshotProposalSelector">
        {this.snapshotProposalsLoaded ? (
          <QueryList
            checkmark={true}
            items={this.all_proposals.sort((a, b) => {
              return b.created - a.created;
            })}
            inputAttrs={{
              placeholder: 'Search for an existing snapshot proposal...',
            }}
            itemRender={(sn: SnapshotProposal) => {
              const selected = sn.id === vnode.attrs.thread.snapshotProposal;
              // TODO: show additional info on the ListItem,
              // like any set proposal title, the creator, or other metadata
              return (
                <ListItem
                  label={
                    <div class="chain-entity-info">
                      <span>{sn.title}</span>
                      <span>Hash: ${sn.id}</span>
                    </div>
                  }
                  selected={selected}
                  key={sn.id}
                />
              );
            }}
            itemPredicate={(query, sn: SnapshotProposal) => {
              // TODO
              return sn.title
                ?.toString()
                .toLowerCase()
                .includes(query.toLowerCase());
            }}
            onSelect={(sn: SnapshotProposal) => {
              onSelect(sn);
            }}
          />
        ) : (
          <div class="loading-container">
            <div class="loading-container-text">
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

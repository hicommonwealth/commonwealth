import $ from 'jquery';
import app from 'state';
import m from 'mithril';
import { SnapshotProposalStore } from 'stores';

class SnapshotController {
  private _proposalStore: SnapshotProposalStore = new SnapshotProposalStore();
  // private _votes = new Store<SnapshotVote>();
  public get proposalStore() { return this._proposalStore; }

  public async fetchSnapshotProposals(snapshot: string) {
    return new Promise((resolve, reject) => {
      this._proposalStore.clear();
      resolve('');
      m.redraw();
    });
  }
}

export default SnapshotController;

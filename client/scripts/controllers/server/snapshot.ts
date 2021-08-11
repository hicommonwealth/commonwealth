import $ from 'jquery';
import Snapshot from '@snapshot-labs/snapshot.js';
import { SnapshotProposalStore } from 'stores';
import { getProposals } from 'helpers/snapshot_utils/snapshot_utils';
import { SnapshotProposal } from '../../models';

const hubUrl = process.env.SNAPSHOT_APP_HUB_URL || 'https://hub.snapshot.org';

class SnapshotController {
  private _proposalStore: SnapshotProposalStore = new SnapshotProposalStore();
  // private _votes = new Store<SnapshotVote>();
  public get proposalStore() { return this._proposalStore; }
  public client = new Snapshot.Client(hubUrl);
  public spaces: any;

  public async fetchSnapshotProposals(space: string) {
    const response = await getProposals(space);
    // if (response.status !== 'Success') {
    //   throw new Error(`Cannot fetch snapshot proposals: ${response.status}`);
    // }
    console.log(space, response);
    this._proposalStore.clear();
    for (const proposal of response.data.proposals) {
      this._proposalStore.add(new SnapshotProposal({
        ipfsHash: proposal.ipfs,
        authorAddress: proposal.author,
        timestamp: proposal.created,
        start: proposal.start,
        end: proposal.end,
        name: proposal.title,
        body: proposal.body,
        snapshot: proposal.snapshot,
        choices: proposal.choices,
      }));
    }
  }
}

export default SnapshotController;

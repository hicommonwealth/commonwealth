import $ from 'jquery';
import Snapshot from '@snapshot-labs/snapshot.js';
import { SnapshotProposalStore } from 'stores';
import { SnapshotProposal } from '../../models';

const hubUrl = process.env.SNAPSHOT_APP_HUB_URL || 'https://testnet.snapshot.org';

class SnapshotController {
  private _proposalStore: SnapshotProposalStore = new SnapshotProposalStore();
  // private _votes = new Store<SnapshotVote>();
  public get proposalStore() { return this._proposalStore; }
  public client = new Snapshot.Client(hubUrl);
  public spaces: any;

  public async fetchSnapshotProposals(snapshot: string) {
    const response = await $.get(`${hubUrl}/api/${snapshot}/proposals`);
    // if (response.status !== 'Success') {
    //   throw new Error(`Cannot fetch snapshot proposals: ${response.status}`);
    // }
    this._proposalStore.clear();
    for (const key of Object.keys(response)) {
      this._proposalStore.add(new SnapshotProposal(
        key,
        response[key].address,
        +response[key].msg.timestamp,
        response[key].msg.payload.start,
        response[key].msg.payload.end,
        response[key].msg.payload.name,
        response[key].msg.payload.body,
        response[key].sig,
        response[key].authorIpfsHash,
        response[key].relayerIpfsHash,
        response[key].msg.payload.choices,
        response[key].msg.private
      ));
    }
  }
}

export default SnapshotController;

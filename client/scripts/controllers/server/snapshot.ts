import $ from 'jquery';
import app from 'state';
import m from 'mithril';
import { SnapshotProposalStore } from 'stores';
import { SnapshotProposal } from '../../models';

class SnapshotController {
  private _proposalStore: SnapshotProposalStore = new SnapshotProposalStore();
  // private _votes = new Store<SnapshotVote>();
  public get proposalStore() { return this._proposalStore; }

  public async fetchSnapshotProposals(snapshot: string) {
    const hubUrl = process.env.SNAPSHOT_HUB_URL || 'https://testnet.snapshot.org';
    const response = await $.get(`${hubUrl}/api/${snapshot}/proposals`);
    // if (response.status !== 'Success') {
    //   throw new Error(`Cannot fetch snapshot proposals: ${response.status}`);
    // }
    this._proposalStore.clear();
    for (const key in response) {
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
      ))
    }
  }
}

export default SnapshotController;

import {
  getProposals,
  getSpace,
  SnapshotProposal,
  SnapshotSpace,
} from 'helpers/snapshot_utils';

class SnapshotController {
  private _space: SnapshotSpace;
  public get space() {
    return this._space;
  }

  private _proposals: SnapshotProposal[];
  public get proposals() {
    return this._proposals;
  }

  private _initializing: boolean = false;
  private _initialized: boolean = false;
  public get initialized() {
    return this._initialized;
  }

  // private _votes = new Store<SnapshotVote>();

  public async refreshProposals() {
    const newProposals = await getProposals(this.space.id);
    this._proposals = newProposals;
  }

  public async init(space: string) {
    if (this._initializing) return;
    this._initializing = true;
    try {
      this._space = await getSpace(space);
      this._proposals = await getProposals(space);
    } catch (e) {
      console.error(`Failed to fetch snapshot proposals: ${e.message}`);
    }
    this._initializing = false;
    this._initialized = true;
  }

  public async deinit() {
    this._initialized = false;
    this._space = null;
    this._proposals = [];
  }
}

export default SnapshotController;

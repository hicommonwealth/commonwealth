import { EventEmitter } from 'events';
import type { SnapshotProposal, SnapshotSpace } from 'helpers/snapshot_utils';
import { getProposals, getSpace } from 'helpers/snapshot_utils';

class SnapshotController {
  private _space: SnapshotSpace;
  public get space() {
    return this._space;
  }

  private _proposals: SnapshotProposal[];
  public get proposals() {
    return this._proposals;
  }

  private _initializing = false;
  private _initialized = false;
  public get initialized() {
    return this._initialized;
  }

  public snapshotEmitter: EventEmitter = new EventEmitter();

  // private _votes = new Store<SnapshotVote>();

  public async refreshProposals() {
    const newProposals = await getProposals(this.space.id);
    this._proposals = newProposals;
  }

  public async init(space: string): Promise<any> {
    if (this._initializing) return;
    this._initializing = true;
    try {
      this._space = await getSpace(space);
      this._proposals = await getProposals(space);
      if (this._space === null) {
        this._initializing = false;
        this._initialized = true;
        this.snapshotEmitter.emit('initialized');
        return null;
      }
    } catch (e) {
      console.error(`Failed to fetch snapshot proposals: ${e.message}`);
    }
    this._initializing = false;
    this._initialized = true;

    this.snapshotEmitter.emit('initialized');
  }

  public async deinit() {
    this._initialized = false;
    this._space = null;
    this._proposals = [];

    this.snapshotEmitter.emit('deinitialized');
  }
}

export default SnapshotController;

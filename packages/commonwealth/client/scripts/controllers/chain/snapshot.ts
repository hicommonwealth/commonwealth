import { EventEmitter } from 'events';
import type { SnapshotProposal, SnapshotSpace } from 'helpers/snapshot_utils';
import { getSpace } from 'helpers/snapshot_utils';
import { getSnapshotProposalsQuery } from 'state/api/snapshots';

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
    this._proposals = await getSnapshotProposalsQuery({
      space: this.space.id,
    });
  }

  public async init(space: string): Promise<void> {
    if (this._initializing) return;
    this._initializing = true;
    try {
      this._space = await getSpace(space);
      this._proposals = await getSnapshotProposalsQuery({
        space,
      });
      if (this._space === null) {
        this._initializing = false;
        this._initialized = true;
        this.snapshotEmitter.emit('initialized');
        // @ts-expect-error StrictNullChecks
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
    // @ts-expect-error StrictNullChecks
    this._space = null;
    this._proposals = [];

    this.snapshotEmitter.emit('deinitialized');
  }
}

export default SnapshotController;

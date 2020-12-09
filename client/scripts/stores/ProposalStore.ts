import { IIdentifiable } from 'adapters/shared';
import Store from './Store';

class ProposalStore<ProposalT extends IIdentifiable> extends Store<ProposalT> {
  private _storeId: { [hash: string]: ProposalT } = {};

  public add(proposal: ProposalT) {
    super.add(proposal);
    this._storeId[proposal.identifier] = proposal;
    return this;
  }

  public update(proposal: ProposalT, eqFn?: (a: ProposalT) => boolean) {
    if (this.getByIdentifier(proposal.identifier)) {
      this.remove(proposal, eqFn);
      this.add(proposal);
    }
    return this;
  }

  public remove(proposal: ProposalT, eqFn?: (a: ProposalT) => boolean) {
    super.remove(proposal, eqFn);
    delete this._storeId[proposal.identifier];
    return this;
  }

  public clear() {
    super.clear();
    this._storeId = {};
  }

  public getByIdentifier(identifier: string | number): ProposalT {
    return this._storeId[identifier];
  }
}

export default ProposalStore;

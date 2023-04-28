import type { IIdentifiable } from 'adapters/shared';
import Store from './Store';

class ProposalStore<ProposalT extends IIdentifiable> extends Store<ProposalT> {
  private _storeId: { [hash: string]: ProposalT } = {};

  public add(proposal: ProposalT) {
    super.add(proposal, (x) => x.identifier === proposal.identifier);
    this._storeId[proposal.identifier] = proposal;
    return this;
  }

  public update(newProposal: ProposalT) {
    const oldProposal = this.getByIdentifier(newProposal.identifier);
    if (oldProposal) {
      super.update(oldProposal, (x) => x.identifier === oldProposal.identifier);
      this._storeId[oldProposal.identifier] = { ...newProposal };
    } else {
      super.add(newProposal);
      this.add(newProposal);
    }
    return this;
  }

  public remove(proposal: ProposalT) {
    super.remove(proposal);
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

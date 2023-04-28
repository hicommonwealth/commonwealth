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
    super.add(newProposal, (x) => x.identifier === newProposal.identifier);
    if (oldProposal) {
      this._storeId[oldProposal.identifier] = newProposal;
    } else {
      this._storeId[newProposal.identifier] = newProposal;
    }
    return this;
  }

  public remove(proposal: ProposalT) {
    super.remove(proposal, (x) => x.identifier === proposal.identifier);
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

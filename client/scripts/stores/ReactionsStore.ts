import IdStore from './IdStore';
import { OffchainReaction } from '../models';
import { byAscendingCreationDate } from '../helpers';
import { IUniqueId } from '../models/interfaces';

class ReactionsStore extends IdStore<OffchainReaction<any>> {
  private _storeProposal: { [identifier: string]: Array<OffchainReaction<any>> } = {};

  public add(reaction: OffchainReaction<any>) {
    // TODO: Remove this once we start enforcing an ordering in stores
    super.add(reaction);
    this.getAll().sort(byAscendingCreationDate);

    if (!this._storeProposal[reaction.proposal.uniqueIdentifier]) {
      this._storeProposal[reaction.proposal.uniqueIdentifier] = [];
    }
    this._storeProposal[reaction.proposal.uniqueIdentifier].push(reaction);
    this._storeProposal[reaction.proposal.uniqueIdentifier].sort(byAscendingCreationDate);

    return this;
  }

  public remove(reaction: OffchainReaction<any>) {
    super.remove(reaction);

    const proposalIndex = this._storeProposal[reaction.proposal.uniqueIdentifier].indexOf(reaction);
    if (proposalIndex === -1) {
      throw new Error('Reaction not in proposals store');
    }
    this._storeProposal[reaction.proposal.uniqueIdentifier].splice(proposalIndex, 1);
    return this;
  }

  public clear() {
    super.clear();
    this._storeProposal = {};
  }

  public clearProposal<T extends IUniqueId>(proposal: T) {
    if (this._storeProposal[proposal.uniqueIdentifier]) {
      const reactions = this._storeProposal[proposal.uniqueIdentifier].slice();
      reactions.map(this.remove.bind(this));
      delete this._storeProposal[proposal.uniqueIdentifier];
    }
    return this;
  }

  public getByProposal<T extends IUniqueId>(proposal: T): Array<OffchainReaction<any>> {
    return this._storeProposal[proposal.uniqueIdentifier] || [];
  }
}

export default ReactionsStore;

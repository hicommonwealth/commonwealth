import IdStore from './IdStore';
import { OffchainReaction, AnyProposal, OffchainThread, OffchainComment } from '../models';
import { byAscendingCreationDate } from '../helpers';
import { IUniqueId } from '../models/interfaces';

enum PostType {
  discussion = 'discussion',
  comment = 'comment'
}

class ReactionsStore extends IdStore<OffchainReaction<any>> {
  private _storeProposal: { [identifier: string]: Array<OffchainReaction<any>> } = {};

  public add(reaction: OffchainReaction<any>) {
    // TODO: Remove this once we start enforcing an ordering in stores
    super.add(reaction);
    this.getAll().sort(byAscendingCreationDate);
    const identifier = this.getIdentifier(reaction);

    if (!this._storeProposal[identifier]) {
      this._storeProposal[identifier] = [];
    }
    this._storeProposal[identifier].push(reaction);
    this._storeProposal[identifier].sort(byAscendingCreationDate);

    return this;
  }

  public remove(reaction: OffchainReaction<any>) {
    super.remove(reaction);
    const identifier = this.getIdentifier(reaction);
    const proposalIndex = this._storeProposal[identifier].indexOf(reaction);
    if (proposalIndex === -1) {
      throw new Error('Reaction not in proposals store');
    }
    this._storeProposal[identifier].splice(proposalIndex, 1);
    return this;
  }

  public clear() {
    super.clear();
    this._storeProposal = {};
  }

  public clearPost(id: number | string, type: PostType) {
    if (this._storeProposal[`${type}-${id.toString()}`]) {
      const reactions = this._storeProposal[`${type}-${id.toString()}`].slice();
      reactions.map(this.remove.bind(this));
      delete this._storeProposal[`${type}-${id.toString()}`];
    }
    return this;
  }

  public getByPost(id: number | string, type: PostType): Array<OffchainReaction<any>> {
    const identifier = `${type}-${id.toString()}`;
    return this._storeProposal[identifier] || [];
  }

  public getIdentifier(reaction: OffchainReaction<any>): string {
    const { threadId, commentId } = reaction;
    return threadId ? `discussion-${threadId}` : `comment-${commentId}`;
  }
}

export default ReactionsStore;

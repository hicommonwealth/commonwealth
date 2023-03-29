import { byAscendingCreationDate } from '../helpers';
import type { AnyProposal } from '../models';
import { AbridgedThread, Comment, Proposal, Reaction, Thread } from '../models';
import IdStore from './IdStore';

class ReactionStore extends IdStore<Reaction> {
  private _storePost: { [identifier: string]: Array<Reaction> } = {};

  public add(reaction: Reaction) {
    // TODO: Remove this once we start enforcing an ordering in stores
    const identifier = this.getPostIdentifier(reaction);
    const reactionAlreadyInStore =
      (this._storePost[identifier] || []).filter(
        (rxn) => rxn.id === reaction.id
      ).length > 0;
    if (!reactionAlreadyInStore) {
      super.add(reaction);
      this.getAll().sort(byAscendingCreationDate);
      if (!this._storePost[identifier]) {
        this._storePost[identifier] = [];
      }
      this._storePost[identifier].push(reaction);
      this._storePost[identifier].sort(byAscendingCreationDate);
    }

    return this;
  }

  public remove(reaction: Reaction) {
    super.remove(reaction);
    const identifier = this.getPostIdentifier(reaction);
    const proposalIndex = this._storePost[identifier].indexOf(reaction);
    if (proposalIndex === -1) {
      throw new Error('Reaction not in proposals store');
    }
    this._storePost[identifier].splice(proposalIndex, 1);
    if (this._storePost[identifier].length === 0) {
      delete this._storePost[identifier];
    }
    return this;
  }

  public clear() {
    super.clear();
    this._storePost = {};
  }

  public clearPost(identifier: string) {
    if (this._storePost[identifier]) {
      const reactions = this._storePost[identifier].slice();
      reactions.map(this.remove.bind(this));
      delete this._storePost[identifier];
    }
    return this;
  }

  public getByPost(
    post: Thread | AbridgedThread | AnyProposal | Comment<any>
  ): Array<Reaction> {
    const identifier = this.getPostIdentifier(post);
    return this._storePost[identifier] || [];
  }

  public getPostIdentifier(
    rxnOrPost:
      | Reaction
      | Thread
      | AbridgedThread
      | AnyProposal
      | Comment<any>
  ) {
    if (rxnOrPost instanceof Reaction) {
      const { threadId, commentId, proposalId } = rxnOrPost;
      return threadId
        ? `discussion-${threadId}`
        : proposalId
        ? `${proposalId}`
        : `comment-${commentId}`;
    } else if (
      rxnOrPost instanceof Thread ||
      rxnOrPost instanceof AbridgedThread
    ) {
      return `discussion-${rxnOrPost.id}`;
    } else if (rxnOrPost instanceof Proposal) {
      return `${(rxnOrPost as AnyProposal).slug}_${
        (rxnOrPost as AnyProposal).identifier
      }`;
    } else if (rxnOrPost instanceof Comment) {
      return `comment-${rxnOrPost.id}`;
    }
  }
}

export default ReactionStore;

import type { AnyProposal, Reaction } from 'models';
import { AbridgedThread, Comment, Proposal, Thread } from 'models';
import type ReactionCount from 'models/ReactionCount';
import IdStore from 'stores/IdStore';

class ReactionCountsStore extends IdStore<ReactionCount<any>> {
  private _storeRC: { [identifier: string]: ReactionCount<any> } = {};

  public add(reactionCount: ReactionCount<any>) {
    const identifier = this.getIdentifier(reactionCount);
    const reactionAlreadyInStore = this._storeRC[identifier];
    if (!reactionAlreadyInStore) {
      super.add(reactionCount);
      this._storeRC[identifier] = reactionCount;
    }
    return this;
  }

  public update(reactionCount: ReactionCount<any>) {
    const identifier = this.getIdentifier(reactionCount);
    if (!this._storeRC[identifier]) {
      throw new Error('Reaction count not in proposals store');
    }
    super.update(reactionCount);
    this._storeRC[identifier] = reactionCount;
    return this;
  }

  public remove(reactionCount: ReactionCount<any>) {
    super.remove(reactionCount);
    const identifier = this.getIdentifier(reactionCount);
    if (!this._storeRC[identifier]) {
      throw new Error('Reaction not in proposals store');
    }
    delete this._storeRC[identifier];
    return this;
  }

  public clear() {
    super.clear();
    this._storeRC = {};
  }

  public getByPost(
    post: Thread | AbridgedThread | AnyProposal | Comment<any>
  ): ReactionCount<any> {
    const identifier = this.getPostIdentifier(post);
    return this._storeRC[identifier] || null;
  }

  public getIdentifier({ threadId, commentId, proposalId }) {
    return threadId
      ? `discussion-${threadId}`
      : proposalId
      ? `${proposalId}`
      : `comment-${commentId}`;
  }

  public getPostIdentifier(
    rxnOrPost:
      | Reaction<any>
      | Thread
      | AbridgedThread
      | AnyProposal
      | Comment<any>
  ) {
    if (rxnOrPost instanceof Thread || rxnOrPost instanceof AbridgedThread) {
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

export default ReactionCountsStore;

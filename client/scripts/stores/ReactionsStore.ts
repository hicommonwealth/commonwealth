import IdStore from './IdStore';
import { OffchainReaction, AnyProposal, OffchainThread, OffchainComment } from '../models';
import { byAscendingCreationDate } from '../helpers';
import { IUniqueId } from '../models/interfaces';

enum PostType {
  discussion = 'discussion',
  comment = 'comment'
}

class ReactionsStore extends IdStore<OffchainReaction<any>> {
  private _storePost: { [identifier: string]: Array<OffchainReaction<any>> } = {};

  public add(reaction: OffchainReaction<any>) {
    // TODO: Remove this once we start enforcing an ordering in stores
    super.add(reaction);
    this.getAll().sort(byAscendingCreationDate);
    const identifier = this.getPostIdentifier(reaction);

    if (!this._storePost[identifier]) {
      this._storePost[identifier] = [];
    }
    this._storePost[identifier].push(reaction);
    this._storePost[identifier].sort(byAscendingCreationDate);

    return this;
  }

  public remove(reaction: OffchainReaction<any>) {
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

  public getByPost(post: OffchainThread | OffchainComment<any>): Array<OffchainReaction<any>> {
    const identifier = this.getPostIdentifier(post);
    return this._storePost[identifier] || [];
  }

  public getPostIdentifier(rxnOrPost: OffchainReaction<any> | OffchainThread | OffchainComment<any>) {
    if (rxnOrPost instanceof OffchainReaction) {
      const { threadId, commentId } = rxnOrPost;
      return threadId ? `discussion-${threadId}` : `comment-${commentId}`;
    } else if (rxnOrPost instanceof OffchainThread) {
      return `discussion-${rxnOrPost.id}`;
    } else if (rxnOrPost instanceof OffchainComment) {
      return `comment-${rxnOrPost.id}`;
    }
  }
}

export default ReactionsStore;

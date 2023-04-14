import { byAscendingCreationDate } from '../helpers';
import type AbridgedThread from '../models/AbridgedThread';
import type Thread from '../models/Thread';
import IdStore from './IdStore';

class CommentsStore extends IdStore<Comment<any>> {
  private _storeAuthor: { [address: string]: Array<Comment<any>> } = {};

  private _storeProposal: { [identifier: string]: Array<Comment<any>> } = {};

  public add(comment: Comment<any>) {
    // TODO: Remove this once we start enforcing an ordering in stores
    super.add(comment);
    this.getAll().sort(byAscendingCreationDate);
    if (!this._storeAuthor[comment.author]) {
      this._storeAuthor[comment.author] = [];
    }
    this._storeAuthor[comment.author].push(comment);
    this._storeAuthor[comment.author].sort(byAscendingCreationDate);
    if (!this._storeProposal[comment.threadId]) {
      this._storeProposal[comment.threadId] = [];
    }
    this._storeProposal[comment.threadId].push(comment);
    this._storeProposal[comment.threadId].sort(byAscendingCreationDate);
    return this;
  }

  public remove(comment: Comment<any>) {
    super.remove(comment);

    const authorIndex = this._storeAuthor[comment.author].indexOf(comment);
    if (authorIndex === -1) {
      console.error(
        'Attempting to remove a comment that was not found in the authors store'
      );
    }
    this._storeAuthor[comment.author].splice(authorIndex, 1);

    if (comment.threadId) {
      const proposalIndex =
        this._storeProposal[comment.threadId].indexOf(comment);
      if (comment.proposal && proposalIndex === -1) {
        console.error(
          'Attempting to remove a comment that was not found in the proposals store'
        );
      }
      this._storeProposal[comment.threadId].splice(proposalIndex, 1);
    }
    return this;
  }

  public clear() {
    super.clear();
    this._storeAuthor = {};
    this._storeProposal = {};
  }

  public clearByThread(thread: Thread) {
    if (this._storeProposal[thread.id]) {
      const comments = this._storeProposal[thread.id].slice();
      comments.map(this.remove.bind(this));
      delete this._storeProposal[thread.id];
    }
    return this;
  }

  public getById(id: number): Comment<any> {
    return this._store.find((c) => c.id === id);
  }

  public getByAuthor(address: string): Array<Comment<any>> {
    return this._storeAuthor[address] || [];
  }

  public getByThread(thread: Thread | AbridgedThread): Array<Comment<any>> {
    return this._storeProposal[thread.id] || [];
  }

  public nComments(thread: Thread): number {
    if (this._storeProposal[thread.id]) {
      return this._storeProposal[thread.id].filter((c) => !c.deleted).length;
    } else {
      return 0;
    }
  }
}

export default CommentsStore;

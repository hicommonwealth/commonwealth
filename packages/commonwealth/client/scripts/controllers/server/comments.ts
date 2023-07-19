import { EventEmitter } from 'events';
import { CommentsStore, ReactionCountsStore, ReactionStore } from 'stores';
import AbridgedThread from '../../models/AbridgedThread';
import Comment from '../../models/Comment';
import Thread from '../../models/Thread';
import type { AnyProposal } from '../../models/types';

class CommentsController {
  public isReactionFetched = new EventEmitter();
  private _store: CommentsStore = new CommentsStore();
  private _reactionCountsStore: ReactionCountsStore = new ReactionCountsStore();
  private _reactionsStore: ReactionStore = new ReactionStore();

  public get store() {
    return this._store;
  }

  public get reactionCountsStore() {
    return this._reactionCountsStore;
  }

  public get reactionsStore() {
    return this._reactionsStore;
  }

  public deinitReactionCountsStore() {
    this.reactionCountsStore.clear();
  }

  public getReactionByPost(post: Thread | AbridgedThread | AnyProposal | Comment<any>) {
    return this.reactionsStore.getByPost(post);
  }

  public deinitReactionsStore() {
    this.store.clear();
  }
}

export default CommentsController;

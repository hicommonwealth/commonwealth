import axios from 'axios';
import { notifyError } from 'controllers/app/notifications';
import { EventEmitter } from 'events';
import _ from 'lodash';
import moment from 'moment';
import app from 'state';
import { CommentsStore, ReactionCountsStore, ReactionStore } from 'stores';
import AbridgedThread from '../../models/AbridgedThread';
import Comment from '../../models/Comment';
import Thread from '../../models/Thread';
import type { IUniqueId } from '../../models/interfaces';
import type { AnyProposal } from '../../models/types';
import { updateLastVisited } from '../app/login';

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

  public getById(id: number) {
    return this._store.getById(id);
  }

  public getByThread(thread: Thread | AbridgedThread) {
    return this._store.getByThread(thread);
  }

  public nComments(thread: Thread) {
    return this._store.nComments(thread);
  }

  public lastCommented(thread: Thread) {
    const comments = this._store.getByThread(thread);
    if (comments.length === 0) return null;
    return moment(Math.max(...comments.map((c) => +c.createdAt)));
  }

  public commenters(thread: Thread) {
    const authors = this._store
      .getByThread(thread)
      .map((comment) => comment.author);
    return _.uniq(authors);
  }

  public initialize(initialComments = [], reset = true) {
    if (reset) {
      this._store.clear();
    }
    initialComments.forEach((comment) => {
      if (!comment.Address) {
        console.error('Comment missing linked address');
      }
      const existing = this._store.getById(comment.id);
      if (existing) {
        this._store.remove(existing);
      }
      try {
        this._store.add(new Comment(comment));
      } catch (e) {
        // Comment is on an object that was deleted or unavailable
      }
    });
  }

  public deinit() {
    this.store.clear();
  }
}

export default CommentsController;

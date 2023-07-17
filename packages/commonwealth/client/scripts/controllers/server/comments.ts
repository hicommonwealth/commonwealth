import { notifyError } from 'controllers/app/notifications';
import { modelFromServer as modelReactionFromServer } from 'controllers/server/reactions';
import _ from 'lodash';
import moment from 'moment';
import app from 'state';
import { CommentsStore } from 'stores';
import AbridgedThread from '../../models/AbridgedThread';
import Attachment from '../../models/Attachment';
import Comment from '../../models/Comment';
import type { IUniqueId } from '../../models/interfaces';
import Thread from '../../models/Thread';
import { updateLastVisited } from '../app/login';
import axios from 'axios';
import $ from 'jquery';

export const modelFromServer = (comment) => {
  const attachments = comment.Attachments
    ? comment.Attachments.map((a) => new Attachment(a.url, a.description))
    : [];

  const { reactions } = comment;
  if (reactions) {
    for (const reaction of reactions) {
      app.reactions.store.add(modelReactionFromServer(reaction));
    }
  }

  let versionHistory;
  if (comment.version_history) {
    versionHistory = comment.version_history.map((v) => {
      if (!v) return;
      let history;
      try {
        history = JSON.parse(v || '{}');
        history.author =
          typeof history.author === 'string'
            ? JSON.parse(history.author)
            : typeof history.author === 'object'
            ? history.author
            : null;
        history.timestamp = moment(history.timestamp);
      } catch (e) {
        console.log(e);
      }
      return history;
    });
  }

  const lastEdited = comment.last_edited
    ? moment(comment.last_edited)
    : versionHistory && versionHistory?.length > 1
    ? versionHistory[0].timestamp
    : null;

  const markedAsSpamAt = comment.marked_as_spam_at
    ? moment(comment.marked_as_spam_at)
    : null;

  const commentParams =
    comment.deleted_at?.length > 0
      ? {
          chain: comment.chain,
          author: comment?.Address?.address || comment.author,
          text: '[deleted]',
          plaintext: '[deleted]',
          versionHistory: [],
          attachments: [],
          threadId: comment.thread_id,
          id: comment.id,
          createdAt: moment(comment.created_at),
          rootThread: comment.thread_id,
          parentComment: Number(comment.parent_id) || null,
          authorChain: comment?.Address?.chain || comment.authorChain,
          lastEdited,
          markedAsSpamAt,
          deleted: true,
          canvasAction: comment.canvas_action,
          canvasSession: comment.canvas_session,
          canvasHash: comment.canvas_hash,
        }
      : {
          chain: comment.chain,
          author: comment?.Address?.address || comment.author,
          text: decodeURIComponent(comment.text),
          plaintext: comment.plaintext,
          versionHistory,
          attachments,
          threadId: comment.thread_id,
          id: comment.id,
          createdAt: moment(comment.created_at),
          rootThread: comment.thread_id,
          parentComment: Number(comment.parent_id) || null,
          authorChain: comment?.Address?.chain || comment.authorChain,
          lastEdited,
          markedAsSpamAt,
          deleted: false,
          canvasAction: comment.canvas_action,
          canvasSession: comment.canvas_session,
          canvasHash: comment.canvas_hash,
        };

  return new Comment(commentParams);
};

class CommentsController {
  private _store: CommentsStore = new CommentsStore();

  public get store() {
    return this._store;
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async create<T extends IUniqueId>(
    address: string,
    threadId: number,
    chain: string,
    unescapedText: string,
    parentCommentId: any = null,
    attachments?: string[]
  ) {
    let chainEntity;
    try {
      // TODO: Create a new type for proposal comments?
      const { session, action, hash } = await app.sessions.signComment({
        thread_id: threadId,
        body: unescapedText,
        parent_comment_id: parentCommentId,
      });

      const res = await axios.post(
        `${app.serverUrl()}/threads/${threadId}/comments`,
        {
          author_chain: app.user.activeAccount.chain.id,
          chain,
          address: app.user.activeAccount.address,
          parent_id: parentCommentId,
          chain_entity_id: chainEntity?.id,
          'attachments[]': attachments,
          text: encodeURIComponent(unescapedText),
          jwt: app.user.jwt,
          canvas_action: action,
          canvas_session: session,
          canvas_hash: hash,
        }
      );
      const { result } = res.data;
      const newComment = modelFromServer(result);
      this._store.add(newComment);
      const activeEntity = app.chain;
      updateLastVisited(activeEntity.meta, true);

      // increment thread count in thread store
      const thread = app.threads.getById(threadId);
      if (thread) {
        app.threads.updateThreadInStore(
          new Thread({
            ...thread,
            numberOfComments: thread.numberOfComments + 1,
          })
        );
      }

      return newComment;
    } catch (err) {
      console.log('Failed to create comment');
      throw new Error(
        err.responseJSON && err.responseJSON.error
          ? err.responseJSON.error
          : 'Failed to create comment'
      );
    }
  }

  public async edit(
    comment: Comment<any>,
    body: string,
    attachments?: string[]
  ) {
    const newBody = body || comment.text;
    try {
      const { session, action, hash } = await app.sessions.signComment({
        thread_id: comment.threadId,
        body,
        parent_comment_id: comment.parentComment,
      });
      const res = await axios.patch(
        `${app.serverUrl()}/comments/${comment.id}`,
        {
          address: app.user.activeAccount.address,
          author_chain: app.user.activeAccount.chain.id,
          id: comment.id,
          chain: comment.chain,
          body: encodeURIComponent(newBody),
          'attachments[]': attachments,
          jwt: app.user.jwt,
          canvas_action: action,
          canvas_session: session,
          canvas_hash: hash,
        }
      );
      const result = modelFromServer(res.data.result);
      if (this._store.getById(result.id)) {
        this._store.remove(this._store.getById(result.id));
      }
      this._store.add(result);
      return result;
    } catch (err) {
      console.log('Failed to edit comment');
      throw new Error(
        err.responseJSON && err.responseJSON.error
          ? err.responseJSON.error
          : 'Failed to edit comment'
      );
    }
  }

  public async delete(comment: any, threadId: number) {
    const { session, action, hash } = await app.sessions.signDeleteComment({
      comment_id: comment.canvasHash,
    });
    return new Promise((resolve, reject) => {
      axios({
        url: `${app.serverUrl()}/comments/${comment.id}`,
        method: 'DELETE',
        data: {
          jwt: app.user.jwt,
          address: app.user.activeAccount.address,
          author_chain: app.user.activeAccount.chain.id,
          chain: comment.chain,
        },
      })
        .then((result) => {
          const existing = this._store.getById(comment.id);
          const revisedComment: any = Object.assign(existing, {
            deleted: true,
            text: '[deleted]',
            plaintext: '[deleted]',
            versionHistory: [],
            canvas_action: action,
            canvas_session: session,
            canvas_hash: hash,
          });
          const softDeletion = new Comment(revisedComment);
          this._store.remove(existing);
          this._store.add(softDeletion);

          // decrement thread count in thread store
          const thread = app.threads.getById(threadId);
          if (thread) {
            app.threads.updateThreadInStore(
              new Thread({
                ...thread,
                numberOfComments: thread.numberOfComments - 1,
              })
            );
          }

          resolve(result);
        })
        .catch((e) => {
          console.error(e);
          notifyError('Could not delete comment');
          reject(e);
        });
    });
  }

  public async toggleSpam(commentId: number, isSpam: boolean) {
    try {
      const verb = isSpam ? 'put' : 'delete';
      const response = await axios[verb](
        `${app.serverUrl()}/comments/${commentId}/spam`,
        {
          data: {
            jwt: app.user.jwt,
            chain_id: app.activeChainId(),
          } as any,
        }
      );
      const comment = this._store.getById(commentId);
      const result = modelFromServer({
        ...comment,
        ...response.data.result,
      });
      if (comment) {
        this._store.remove(comment);
      }
      this._store.add(result);
      return result;
    } catch (err) {
      console.error(err);
      notifyError(`Could not ${!isSpam ? 'mark' : 'unmark'} comment as spam`);
      throw err;
    }
  }

  public async refresh(thread: Thread, chainId: string) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        // TODO: Change to GET /comments
        const response = await axios.get(`${app.serverUrl()}/viewComments`, {
          params: {
            chain: chainId,
            thread_id: thread.id,
          },
        });
        if (response.data.status !== 'Success') {
          reject(new Error(`Unsuccessful status: ${response.status}`));
        }
        this._store.clearByThread(thread);
        response.data.result.forEach((comment) => {
          // TODO: Comments should always have a linked Address
          if (!comment.Address) console.error('Comment missing linked address');
          const model = modelFromServer(comment);
          this._store.add(model);
        });
        resolve();
      } catch (err) {
        console.log('Failed to load comments');
        reject(
          new Error(
            err.responseJSON?.error
              ? err.responseJSON.error
              : 'Error loading comments'
          )
        );
      }
    });
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
        this._store.add(modelFromServer(comment));
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

import type { ProposalType } from 'common-common/src/types';
import { notifyError } from 'controllers/app/notifications';
import { modelFromServer as modelReactionFromServer } from 'controllers/server/reactions';
import { uniqueIdToProposal } from 'identifiers';
import $ from 'jquery';
import _ from 'lodash';
import type { IUniqueId } from 'models';
import { Attachment, Comment } from 'models';
import moment from 'moment';

import app from 'state';
import { CommentsStore } from 'stores';
import { updateLastVisited } from '../app/login';

// tslint:disable: object-literal-key-quotes

export enum CommentRefreshOption {
  ResetAndLoadComments = 'ResetAndLoadComments',
  LoadProposalComments = 'LoadProposalComments',
}

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

  let proposal;
  try {
    proposal = uniqueIdToProposal(decodeURIComponent(comment.root_id));
  } catch (e) {
    // no proposal
    console.log(e);
  }

  const commentParams =
    comment.deleted_at?.length > 0
      ? {
          chain: comment.chain,
          author: comment?.Address?.address || comment.author,
          text: '[deleted]',
          plaintext: '[deleted]',
          versionHistory: [],
          attachments: [],
          proposal,
          id: comment.id,
          createdAt: moment(comment.created_at),
          rootProposal: comment.root_id,
          parentComment: Number(comment.parent_id) || null,
          authorChain: comment?.Address?.chain || comment.authorChain,
          lastEdited,
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
          proposal,
          id: comment.id,
          createdAt: moment(comment.created_at),
          rootProposal: comment.root_id,
          parentComment: Number(comment.parent_id) || null,
          authorChain: comment?.Address?.chain || comment.authorChain,
          lastEdited,
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

  public getByProposal<T extends IUniqueId>(proposal: T) {
    return this._store.getByProposal(proposal);
  }

  public nComments<T extends IUniqueId>(proposal: T) {
    return this._store.nComments(proposal);
  }

  public lastCommented<T extends IUniqueId>(proposal: T) {
    const comments = this._store.getByProposal(proposal);
    if (comments.length === 0) return null;
    return moment(Math.max(...comments.map((c) => +c.createdAt)));
  }

  public commenters<T extends IUniqueId>(proposal: T) {
    const authors = this._store
      .getByProposal(proposal)
      .map((comment) => comment.author);
    return _.uniq(authors);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async create<T extends IUniqueId>(
    address: string,
    proposalIdentifier: string,
    chain: string,
    unescapedText: string,
    parentCommentId: any = null,
    attachments?: string[]
  ) {
    // attempt to find the chain-entity associated with this proposal
    // TODO: is the below assumptions valid?
    // this only works if we assume that all chain-entities for the specific
    // chain are loaded when the comment is created
    const [prefix] = proposalIdentifier.split('_') as [ProposalType, string];
    let chainEntity;
    if (
      prefix.includes('proposal') ||
      prefix.includes('referendum') ||
      prefix.includes('motion')
    ) {
      chainEntity = app.chainEntities.getByUniqueId(
        app.activeChainId(),
        proposalIdentifier
      );
    }
    try {
      // TODO: Create a new type for proposal comments?
      const { session, action, hash } = await app.sessions.signComment({
        thread_id: proposalIdentifier,
        body: unescapedText,
        parent_comment_id: parentCommentId,
      });

      // TODO: Change to POST /comment
      const res = await $.post(`${app.serverUrl()}/createComment`, {
        author_chain: app.user.activeAddressAccount.chain.id,
        chain,
        address,
        parent_id: parentCommentId,
        chain_entity_id: chainEntity?.id,
        root_id: proposalIdentifier,
        'attachments[]': attachments,
        text: encodeURIComponent(unescapedText),
        jwt: app.user.jwt,
        canvas_action: action,
        canvas_session: session,
        canvas_hash: hash,
      });
      const { result } = res;
      const newComment = modelFromServer(result);
      this._store.add(newComment);
      const activeEntity = app.chain;
      updateLastVisited(activeEntity.meta, true);
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
      // TODO: Change to PUT /comment
      const { session, action, hash } = await app.sessions.signComment({
        thread_id: comment.rootProposal,
        body,
        parent_comment_id: comment.parentComment,
      });
      const response = await $.post(`${app.serverUrl()}/editComment`, {
        address: app.user.activeAddressAccount.address,
        author_chain: app.user.activeAddressAccount.chain.id,
        id: comment.id,
        chain: comment.chain,
        body: encodeURIComponent(newBody),
        'attachments[]': attachments,
        jwt: app.user.jwt,
        canvas_action: action,
        canvas_session: session,
        canvas_hash: hash,
      });
      const result = modelFromServer(response.result);
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

  public async delete(comment) {
    const { session, action, hash } = await app.sessions.signDeleteComment({
      comment_id: comment.canvasHash,
    });
    return new Promise((resolve, reject) => {
      // TODO: Change to DELETE /comment
      $.post(`${app.serverUrl()}/deleteComment`, {
        jwt: app.user.jwt,
        comment_id: comment.id,
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
          resolve(result);
        })
        .catch((e) => {
          console.error(e);
          notifyError('Could not delete comment');
          reject(e);
        });
    });
  }

  public async refresh(proposal, chainId: string) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        // TODO: Change to GET /comments
        const response = await $.get(`${app.serverUrl()}/viewComments`, {
          chain: chainId,
          root_id: encodeURIComponent(proposal.uniqueIdentifier),
        });
        if (response.status !== 'Success') {
          reject(new Error(`Unsuccessful status: ${response.status}`));
        }
        this._store.clearProposal(proposal);
        response.result.forEach((comment) => {
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

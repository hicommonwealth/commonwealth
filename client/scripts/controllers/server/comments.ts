import { default as $ } from 'jquery';
import { default as _ } from 'lodash';
import { default as moment } from 'moment-twitter';

import app from 'state';
import { uniqueIdToProposal } from 'identifiers';

import { CommentsStore } from 'stores';
import { OffchainComment, OffchainAttachment, IUniqueId, AnyProposal, OffchainThread } from 'models';
import { notifyError } from 'controllers/app/notifications';
// tslint:disable: object-literal-key-quotes

export enum CommentParent {
  Proposal = 'proposal',
  Comment = 'comment'
}

const modelFromServer = (comment) => {
  const attachments = comment.OffchainAttachments
    ? comment.OffchainAttachments.map((a) => new OffchainAttachment(a.url, a.description))
    : [];
  return new OffchainComment(
    comment.chain,
    comment?.Address?.address || comment.author,
    decodeURIComponent(comment.text),
    comment.version_history,
    attachments,
    uniqueIdToProposal(decodeURIComponent(comment.root_id)),
    comment.id,
    moment(comment.created_at),
    comment.child_comments,
    comment.root_id,
    comment.parent_id,
    comment.community,
    comment?.Address?.chain || comment.authorChain,
  );
};


class CommentsController {
  private _store: CommentsStore = new CommentsStore();

  public get store() { return this._store; }

  public getById(id: number) {
    return this._store.getById(id);
  }

  public getByProposal<T extends IUniqueId>(proposal: T) {
    return this._store.getByProposal(proposal);
  }

  public getByAuthor(address: string, author_chain: string) {
    return this._store.getByAuthor(address);
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
    const authors = this._store.getByProposal(proposal).map((comment) => comment.author);
    return _.uniq(authors);
  }

  public async create<T extends IUniqueId>(
    address: string, proposalIdentifier: string, chain: string,
    community: string, unescapedText: string, parentCommentId: any = null,
    attachments?: string[], mentions?: string[]
  ) {
    const timestamp = moment();
    const firstVersion : any = { timestamp, body: unescapedText };
    const versionHistory : string = JSON.stringify(firstVersion);
    try {
      const res = await $.post(`${app.serverUrl()}/createComment`, {
        'author_chain': app.vm.activeAccount.chain.id,
        'chain': chain,
        'community': community,
        'address': address,
        'parent_id': parentCommentId,
        'root_id': proposalIdentifier,
        'attachments[]': attachments,
        'mentions[]': mentions,
        'text': encodeURIComponent(unescapedText),
        'versionHistory': versionHistory,
        'jwt': app.login.jwt,
      });
      const { result } = res;
      this._store.add(modelFromServer(result));
      // update childComments of parent, if necessary
      if (result.parent_id) {
        const parent = this._store.getById(+result.parent_id);
        parent.childComments.push(result.id);
      }
    } catch (err) {
      console.log('Failed to create comment');
      throw new Error((err.responseJSON && err.responseJSON.error)
        ? err.responseJSON.error
        : 'Failed to create comment');
    }
  }

  public async edit(comment: OffchainComment<any>, body?: string, attachments?: string[]) {
    const newBody = body || comment.text;
    const recentEdit : any = { timestamp: moment(), body };
    const versionHistory = JSON.stringify(recentEdit);
    try {
      const response = await $.post(`${app.serverUrl()}/editComment`, {
        'address': app.vm.activeAccount.address,
        'author_chain': app.vm.activeAccount.chain.id,
        'id': comment.id,
        'chain': comment.chain,
        'community': comment.community,
        'body': encodeURIComponent(newBody),
        'version_history': versionHistory,
        'attachments[]': attachments,
        'jwt': app.login.jwt,
      });
      const result = modelFromServer(response.result);
      if (this._store.getById(result.id)) {
        this._store.remove(this._store.getById(result.id));
      }
      this._store.add(result);
      return result;
    } catch (err) {
      console.log('Failed to edit comment');
      throw new Error((err.responseJSON && err.responseJSON.error)
        ? err.responseJSON.error
        : 'Failed to edit comment');
    }
  }

  public async refresh(proposal, chainId: string, communityId: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await $.get(`${app.serverUrl()}/viewComments`, {
          chain: chainId,
          community: communityId,
          root_id: encodeURIComponent(proposal.uniqueIdentifier),
        });
        if (response.status !== 'Success') {
          reject(new Error(`Unsuccessful status: ${response.status}`));
        }
        this._store.clearProposal(proposal);
        Promise.all(response.result.map(async (comment) => {
          // TODO: Comments should always have a linked Address
          if (!comment.Address) console.error('Comment missing linked address');
          const model = modelFromServer(comment);
          this._store.add(model);
          return model;
        })).then((result) => {
          resolve(result);
        }).catch((error) => {
          reject(error);
        });
      } catch (err) {
        console.log('Failed to load comments');
        reject(new Error(err.responseJSON?.error ? err.responseJSON.error : 'Error loading comments'));
      }
    });
  }

  public async delete(comment) {
    const _this = this;
    return new Promise((resolve, reject) => {
      $.post(`${app.serverUrl()}/deleteComment`, {
        jwt: app.login.jwt,
        comment_id: comment.id,
      }).then((result) => {
        const existing = this._store.getById(comment.id);
        this._store.remove(existing);
        resolve(result);
      }).catch((e) => {
        console.error(e);
        notifyError('Could not delete comment');
        reject(e);
      });
    });
  }

  public async refreshAll(chainId: string, communityId: string, reset = false) {
    try {
      const response = await $.get(`${app.serverUrl()}/bulkComments`, {
        chain: chainId,
        community: communityId,
      });
      if (response.status !== 'Success') {
        throw new Error(`Unsuccessful status: ${response.status}`);
      }
      if (reset) {
        this._store.clear();
      }
      await Promise.all(response.result.map(async (comment) => {
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
      }));
    } catch (err) {
      console.log('failed to load bulk comments');
      throw new Error((err.responseJSON && err.responseJSON.error)
        ? err.responseJSON.error
        : 'Error loading comments');
    }
  }

  public deinit() {
    this.store.clear();
  }
}

export default CommentsController;

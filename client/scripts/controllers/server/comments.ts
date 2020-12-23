import $ from 'jquery';
import _ from 'lodash';
import moment from 'moment-twitter';

import app from 'state';
import { uniqueIdToProposal } from 'identifiers';

import { CommentsStore } from 'stores';
import { OffchainComment, OffchainAttachment, IUniqueId, AddressInfo, CommunityInfo, NodeInfo } from 'models';
import { notifyError } from 'controllers/app/notifications';
import { updateLastVisited } from '../app/login';
// tslint:disable: object-literal-key-quotes

export enum CommentParent {
  Proposal = 'proposal',
  Comment = 'comment',
}

export enum CommentRefreshOption {
  ResetAndLoadOffchainComments = 'ResetAndLoadOffchainComments',
  LoadProposalComments = 'LoadProposalComments',
}

export const modelFromServer = (comment) => {
  const attachments = comment.OffchainAttachments
    ? comment.OffchainAttachments.map((a) => new OffchainAttachment(a.url, a.description))
    : [];

  let proposal;
  try {
    proposal = uniqueIdToProposal(decodeURIComponent(comment.root_id));
  } catch (e) {
    // no proposal
  }

  return new OffchainComment(
    comment.chain,
    comment?.Address?.address || comment.author,
    decodeURIComponent(comment.text),
    comment.plaintext,
    comment.version_history,
    attachments,
    proposal,
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

  public uniqueCommenters<T extends IUniqueId>(proposal: T, proposalAuthor?, proposalAuthorChain?) {
    // Returns an array of [chain, address] arrays
    // TODO: Use a better comparator to determine uniqueness
    const comments = (proposalAuthor && proposalAuthorChain)
      ? [`${proposalAuthorChain}#${proposalAuthor}`]
        .concat(this._store.getByProposal(proposal).map((c) => `${c.authorChain}#${c.author}`))
      : (this._store.getByProposal(proposal)).map((c) => `${c.authorChain}#${c.author}`);

    return _.uniq((comments as string[]))
      .map((slug) => slug.split(/#/))
      .map(([chain, address]) => new AddressInfo(null, address, chain, null));
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
      // TODO: Change to POST /comment
      const res = await $.post(`${app.serverUrl()}/createComment`, {
        'author_chain': app.user.activeAccount.chain.id,
        'chain': chain,
        'community': community,
        'address': address,
        'parent_id': parentCommentId,
        'root_id': proposalIdentifier,
        'attachments[]': attachments,
        'mentions[]': mentions,
        'text': encodeURIComponent(unescapedText),
        'versionHistory': versionHistory,
        'jwt': app.user.jwt,
      });
      const { result } = res;
      this._store.add(modelFromServer(result));
      const activeEntity = app.activeCommunityId() ? app.community : app.chain;
      updateLastVisited(app.activeCommunityId()
        ? (activeEntity.meta as CommunityInfo)
        : (activeEntity.meta as NodeInfo).chain, true);
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
      // TODO: Change to PUT /comment
      const response = await $.post(`${app.serverUrl()}/editComment`, {
        'address': app.user.activeAccount.address,
        'author_chain': app.user.activeAccount.chain.id,
        'id': comment.id,
        'chain': comment.chain,
        'community': comment.community,
        'body': encodeURIComponent(newBody),
        'version_history': versionHistory,
        'attachments[]': attachments,
        'jwt': app.user.jwt,
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

  public async delete(comment) {
    const _this = this;
    return new Promise((resolve, reject) => {
      // TODO: Change to DELETE /comment
      $.post(`${app.serverUrl()}/deleteComment`, {
        jwt: app.user.jwt,
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

  public async refresh(proposal, chainId: string, communityId: string) {
    return new Promise(async (resolve, reject) => {
      try {
        // TODO: Change to GET /comments
        const response = await $.get(`${app.serverUrl()}/viewComments`, {
          chain: chainId,
          community: communityId,
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
        reject(new Error(err.responseJSON?.error ? err.responseJSON.error : 'Error loading comments'));
      }
    });
  }

  public async refreshAll(chainId: string, communityId: string, reset: CommentRefreshOption) {
    try {
      const args: any = {
        chain: chainId,
        community: communityId,
      };
      if (reset === CommentRefreshOption.ResetAndLoadOffchainComments) {
        args.offchain_threads_only = 1;
      }
      if (reset === CommentRefreshOption.LoadProposalComments) {
        args.proposals_only = 1;
      }
      // TODO: Change to GET /comments
      const response = await $.get(`${app.serverUrl()}/bulkComments`, args);
      if (response.status !== 'Success') {
        throw new Error(`Unsuccessful status: ${response.status}`);
      }
      if (reset === CommentRefreshOption.ResetAndLoadOffchainComments) {
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

  public initialize(initialComments, reset = true) {
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

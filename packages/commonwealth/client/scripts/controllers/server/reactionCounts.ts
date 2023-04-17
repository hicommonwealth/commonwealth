/* eslint-disable dot-notation */
import { notifyError } from 'controllers/app/notifications';
import proposalIdToEntity from 'helpers/proposalIdToEntity';
/* eslint-disable no-restricted-syntax */
import $ from 'jquery';
import ReactionCount from 'models/ReactionCount';

import app from 'state';

import { ReactionCountsStore } from 'stores';
import CommentModel from '../../models/CommentModel';
import Proposal from '../../models/Proposal';
import Thread from '../../models/Thread';
import type { AnyProposal } from '../../models/types';

export const modelFromServer = (reactionCount) => {
  const { id, thread_id, comment_id, proposal_id, has_reacted, like } =
    reactionCount;
  return new ReactionCount(
    id,
    thread_id,
    comment_id,
    proposal_id,
    has_reacted,
    // eslint-disable-next-line radix
    parseInt(like)
  );
};

// TODO: Graham 4/24/22: File + class needs to be named ReactionCounts (plural) following convention
class ReactionCountController {
  private _store: ReactionCountsStore = new ReactionCountsStore();
  public get store() {
    return this._store;
  }

  public async create(
    address: string,
    post: any,
    reaction: string,
    chainId: string
  ) {
    // TODO: use canvas id
    const like = reaction === 'like';
    const {
      session = null,
      action = null,
      hash = null,
    } = post instanceof Thread
      ? await app.sessions.signThreadReaction({
          thread_id: (post as Thread).id,
          like,
        })
      : post instanceof Proposal
      ? {}
      : post instanceof CommentModel
      ? await app.sessions.signCommentReaction({
          comment_id: (post as CommentModel<any>).id,
          like,
        })
      : {};

    const options = {
      author_chain: app.user.activeAccount.chain.id,
      chain: chainId,
      address,
      reaction,
      jwt: app.user.jwt,
      canvas_action: action,
      canvas_session: session,
      canvas_hash: hash,
    };
    if (post instanceof Thread) {
      options['thread_id'] = (post as Thread).id;
    } else if (post instanceof Proposal) {
      options['proposal_id'] = `${(post as AnyProposal).slug}_${
        (post as AnyProposal).identifier
      }`;
      const chainEntity = proposalIdToEntity(
        app,
        app.activeChainId(),
        options['proposal_id']
      );
      options['chain_entity_id'] = chainEntity?.id;
    } else if (post instanceof CommentModel) {
      options['comment_id'] = (post as CommentModel<any>).id;
    }
    try {
      const response = await $.post(
        `${app.serverUrl()}/createReaction`,
        options
      );
      const { result } = response;
      const reactionCount = this.store.getByPost(post);
      if (!reactionCount) {
        const { thread_id, proposal_id, comment_id } = result;
        const id = this.store.getIdentifier({
          threadId: thread_id,
          proposalId: proposal_id,
          commentId: comment_id,
        });
        const rc = {
          id,
          thread_id,
          proposal_id,
          comment_id,
          has_reacted: true,
          like: 1,
          canvas_action: action,
          canvas_session: session,
          canvas_hash: hash,
        };
        this.store.add(modelFromServer(rc));
      } else {
        this.store.update({
          ...reactionCount,
          likes: reactionCount.likes + 1,
          hasReacted: true,
        });
      }
    } catch (err) {
      notifyError('Failed to save reaction');
    }
  }

  public async delete(reaction, reactionCount: ReactionCount<any>) {
    const {
      session = null,
      action = null,
      hash = null,
    } = reaction.thread_id
      ? await app.sessions.signDeleteThreadReaction({
          thread_id: reaction.canvas_hash,
        })
      : reaction.proposal_id
      ? {}
      : reaction.comment_id
      ? await app.sessions.signDeleteCommentReaction({
          comment_id: reaction.canvas_hash,
        })
      : {};

    // TODO Graham 4/24/22: Investigate necessity of this duplication
    const _this = this; // eslint-disable-line
    try {
      await $.post(`${app.serverUrl()}/deleteReaction`, {
        jwt: app.user.jwt,
        reaction_id: reaction.id,
        canvas_action: action,
        canvas_session: session,
        canvas_hash: hash,
      });
      _this.store.update(reactionCount);
      if (reactionCount.likes === 0 && reactionCount.dislikes === 0) {
        _this.store.remove(reactionCount);
      }
    } catch (e) {
      console.error(e);
      notifyError('Failed to update reaction count');
    }
  }

  public deinit() {
    this.store.clear();
  }
}

export default ReactionCountController;

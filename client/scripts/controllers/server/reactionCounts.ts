/* eslint-disable dot-notation */
/* eslint-disable no-restricted-syntax */
import $ from 'jquery';
import _ from 'lodash';

import app from 'state';

import { ReactionCountsStore } from 'stores';
import ReactionCount from 'models/ReactionCount';
import { AnyProposal, Comment, OffchainThread, Proposal } from 'models';
import { notifyError } from 'controllers/app/notifications';

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

// TODO Graham 4/24/22: File + class needs to be named ReactionCounts (plural) following convention
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
    const options = {
      author_chain: app.user.activeAccount.chain.id,
      chain: chainId,
      address,
      reaction,
      jwt: app.user.jwt,
    };
    if (post instanceof OffchainThread) {
      options['thread_id'] = (post as OffchainThread).id;
    } else if (post instanceof Proposal) {
      options['proposal_id'] = `${(post as AnyProposal).slug}_${
        (post as AnyProposal).identifier
      }`;
    } else if (post instanceof Comment) {
      options['comment_id'] = (post as Comment<any>).id;
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
    // TODO Graham 4/24/22: Investigate necessity of this duplication
    const _this = this;
    try {
      await $.post(`${app.serverUrl()}/deleteReaction`, {
        jwt: app.user.jwt,
        reaction_id: reaction.id,
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

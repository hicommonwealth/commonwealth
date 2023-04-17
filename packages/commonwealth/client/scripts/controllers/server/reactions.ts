import { ReactionStore } from 'stores';
import type AbridgedThread from '../../models/AbridgedThread';
import type CommentModel from '../../models/CommentModel';
import Reaction from '../../models/Reaction';
import type Thread from '../../models/Thread';
import type { AnyProposal } from '../../models/types';

export const modelFromServer = (reaction) => {
  return new Reaction({
    id: reaction.id,
    author: reaction.Address.address,
    author_chain: reaction.Address.chain,
    chain: reaction.chain,
    reaction: reaction.reaction,
    threadId: reaction.thread_id,
    proposalId: reaction.proposal_id,
    commentId: reaction.comment_id,
    canvasAction: reaction.canvas_action,
    canvasSession: reaction.canvas_session,
    canvasHash: reaction.canvas_hash,
  });
};

// Most of the reactions-related logic is handled directly in ThreadsController, CommentsController,
// or ReactionCountController
class ReactionsController {
  private _store: ReactionStore = new ReactionStore();
  public get store() {
    return this._store;
  }

  public getByPost(post: Thread | AbridgedThread | AnyProposal | CommentModel<any>) {
    return this._store.getByPost(post);
  }

  public initialize(initialReactions, reset = true) {
    if (reset) {
      this._store.clear();
    }
    for (const reaction of initialReactions) {
      // TODO: Reactions should always have a linked Address
      if (!reaction.Address) {
        console.error('Reaction missing linked address');
      }
      // TODO: check `response` against store and update store iff `response` is newer
      const existing = this._store.getById(reaction.id);
      if (existing) {
        this._store.remove(existing);
      }
      try {
        this._store.add(modelFromServer(reaction));
      } catch (e) {
        // console.error(e.message);
      }
    }
  }

  public deinit() {
    this.store.clear();
  }
}

export default ReactionsController;

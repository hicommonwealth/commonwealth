export type ReactionType = 'like';
import type moment from 'moment';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class Reaction {
  public readonly id: number;
  public readonly author: string;
  public readonly communityId: string;
  public readonly reaction: string;
  public readonly threadId: number | string;
  public readonly commentId: number | string;
  public readonly proposalId: number | string;
  public readonly author_chain: string;
  public readonly canvasAction: string;
  public readonly canvasSession: string;
  public readonly canvasHash: string;
  public readonly updatedAt: moment.Moment;

  public calculatedVotingWeight: number;
  // TODO: Do thread/comment/proposal ids ever appear as strings?

  constructor({
    id,
    Address,
    reaction,
    thread_id,
    proposal_id,
    comment_id,
    author_chain,
    canvas_action,
    canvas_session,
    canvas_hash,
    calculated_voting_weight,
    updated_at,
  }) {
    this.id = id;
    this.author = Address.address;
    this.communityId = Address.community_id;
    this.reaction = reaction;
    this.threadId = thread_id;
    this.commentId = comment_id;
    this.proposalId = proposal_id;
    this.author_chain = author_chain;
    this.canvasAction = canvas_action;
    this.canvasSession = canvas_session;
    this.canvasHash = canvas_hash;
    this.calculatedVotingWeight = calculated_voting_weight;
    this.updatedAt = updated_at;
  }
}

export default Reaction;

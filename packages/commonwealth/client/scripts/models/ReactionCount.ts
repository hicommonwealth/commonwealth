import type { IUniqueId } from './interfaces';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class ReactionCount<T extends IUniqueId> {
  public readonly id: string;
  public readonly threadId: number;
  public readonly commentId: number | string;
  public readonly proposalId: number | string;
  public readonly hasReacted: boolean;
  public readonly likes: number;
  public readonly dislikes?: number;

  constructor({
    id,
    thread_id,
    comment_id,
    proposal_id,
    has_reacted,
    like,
    dislikes = 0,
  }) {
    this.id = id;
    this.threadId = thread_id;
    this.commentId = comment_id;
    this.proposalId = proposal_id;
    this.hasReacted = has_reacted;
    this.likes = parseInt(like + '');
    this.dislikes = dislikes;
  }
}

export default ReactionCount;

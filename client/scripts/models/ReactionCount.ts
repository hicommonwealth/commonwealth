import { IUniqueId } from './interfaces';

class ReactionCount<T extends IUniqueId> {
    public readonly id: string;
    public readonly threadId: number;
    public readonly commentId: number | string;
    public readonly proposalId: number | string;
    public readonly hasReacted: boolean;
    public readonly likes: number;
    public readonly dislikes: number;

    constructor(threadId, commentId, proposalId, hasReacted, likes, dislikes = 0) {
    this.id = `discussion-${threadId}` || `comment-${commentId}` || `proposal-${proposalId}`;
    this.threadId = threadId;
    this.commentId = commentId;
    this.proposalId = proposalId;
    this.proposalId = proposalId;
    this.hasReacted = hasReacted;
    this.likes = likes;
    this.dislikes = dislikes;
    }
}

export default ReactionCount;

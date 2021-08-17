import { IUniqueId } from './interfaces';

class ReactionCount<T extends IUniqueId> {
    public readonly id: number;
    public readonly threadId: number;
    public readonly commentId: number | string;
    public readonly proposalId: number | string;
    public readonly hasReacted: boolean;
    public readonly likes: number;
    public readonly dislikes: number;

    constructor(threadId, commentId, proposalId, hasReacted, likes, dislikes = 0) {
    this.id = threadId || commentId || proposalId;
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

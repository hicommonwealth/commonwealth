export type ReactionType = 'like';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class Reaction {
  public readonly id: number;
  public readonly author: string;
  public readonly chain: string;
  public readonly reaction: string;
  public readonly threadId: number | string;
  public readonly commentId: number | string;
  public readonly proposalId: number | string;
  public readonly author_chain: string;
  public readonly canvasAction: string;
  public readonly canvasSession: string;
  public readonly canvasHash: string;
  // TODO: Do thread/comment/proposal ids ever appear as strings?

  constructor({
    id,
    author,
    chain,
    reaction,
    threadId,
    proposalId,
    commentId,
    author_chain,
    canvasAction,
    canvasSession,
    canvasHash,
  }) {
    this.id = id;
    this.author = author;
    this.chain = chain;
    this.reaction = reaction;
    this.threadId = threadId;
    this.commentId = commentId;
    this.proposalId = proposalId;
    this.author_chain = author_chain;
    this.canvasAction = canvasAction;
    this.canvasSession = canvasSession;
    this.canvasHash = canvasHash;
  }
}

export default Reaction;

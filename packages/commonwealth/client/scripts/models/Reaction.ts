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

  // TODO: Do thread/comment/proposal ids ever appear as strings?

  constructor(
    id,
    author,
    chain,
    reaction,
    threadId,
    proposalId,
    commentId,
    author_chain
  ) {
    this.id = id;
    this.author = author;
    this.chain = chain;
    this.reaction = reaction;
    this.threadId = threadId;
    this.commentId = commentId;
    this.proposalId = proposalId;
    this.author_chain = author_chain;
  }
}

export default Reaction;

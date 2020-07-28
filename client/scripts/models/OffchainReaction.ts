import { IUniqueId } from './interfaces';

class OffchainReaction<T extends IUniqueId> {
  public readonly id: number;
  public readonly author: string;
  public readonly chain: string;
  public readonly community: string;
  public readonly reaction: string;
  public readonly threadId: number | string;
  public readonly commentId: number | string;
  public readonly proposalId: number | string;
  public readonly author_chain: string;
  // TODO: Do thread/comment/proposal ids ever appear as strings?

  constructor(id, author, chain, community, reaction, threadId, proposalId, commentId, author_chain) {
    this.id = id;
    this.author = author;
    this.chain = chain;
    this.community = community;
    this.reaction = reaction;
    this.threadId = threadId;
    this.commentId = commentId;
    this.proposalId = proposalId;
    this.author_chain = author_chain;
  }
}

export default OffchainReaction;

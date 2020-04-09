import { IUniqueId } from './interfaces';

class OffchainReaction<T extends IUniqueId> {
  public readonly id: number;
  public readonly author: string;
  public readonly chain: string;
  public readonly community: string;
  public readonly reaction: string;
  public readonly threadId: number | string;
  public readonly commentId: number | string;

  constructor(id, author, chain, community, reaction, threadId, communityId) {
    this.id = id;
    this.author = author;
    this.chain = chain;
    this.community = community;
    this.reaction = reaction;
    this.threadId = threadId;
    this.commentId = communityId;
  }
}

export default OffchainReaction;

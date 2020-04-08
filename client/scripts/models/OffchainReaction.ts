import { IUniqueId } from './interfaces';

class OffchainReaction<T extends IUniqueId> {
  public readonly chain: string;
  public readonly author: string;
  public readonly reaction: string;
  public readonly threadId: number | string;
  public readonly commentId: number | string;
  public readonly id: number;
  public readonly community?: string;

  constructor(chain, author, reaction, threadId, communityId, id, community?) {
    this.chain = chain;
    this.author = author;
    this.reaction = reaction;
    this.threadId = threadId;
    this.commentId = communityId;
    this.id = id;
    this.community = community;
  }
}

export default OffchainReaction;

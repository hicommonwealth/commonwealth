import { IUniqueId } from './interfaces';

class Reaction<T extends IUniqueId> {
  public readonly id: number;
  public readonly author: string;
  public readonly chain: string;
  public readonly reaction: string;
  public readonly threadId: number | string;
  public readonly commentId: number | string;
  public readonly proposalId: number | string;
  public readonly author_chain: string;
  public readonly signature: string;
  public readonly signedData: string;
  public readonly signedHash: string;
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
    signature,
    signedData,
    signedHash,
  }) {
    this.id = id;
    this.author = author;
    this.chain = chain;
    this.reaction = reaction;
    this.threadId = threadId;
    this.commentId = commentId;
    this.proposalId = proposalId;
    this.author_chain = author_chain;
    this.signature = signature;
    this.signedData = signedData;
    this.signedHash = signedHash;
  }
}

export default Reaction;

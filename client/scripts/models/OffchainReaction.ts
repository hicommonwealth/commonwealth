import { IUniqueId } from './interfaces';

class OffchainReaction<T extends IUniqueId> {
  public readonly chain: string;
  public readonly author: string;
  public readonly reaction: string;
  public readonly proposal: T;
  public readonly id: number;
  public readonly community?: string;

  constructor(chain, author, reaction, proposal, id, community?) {
    this.chain = chain;
    this.author = author;
    this.reaction = reaction;
    this.proposal = proposal;
    this.id = id;
    this.community = community;
  }
}

export default OffchainReaction;

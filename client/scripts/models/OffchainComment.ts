import moment from 'moment-twitter';
import { IUniqueId } from './interfaces';
import OffchainAttachment from './OffchainAttachment';

class OffchainComment<T extends IUniqueId> {
  [x: string]: any;
  public readonly chain: string;
  public readonly author: string;
  public readonly text: string;
  public readonly plaintext: string;
  public readonly attachments: OffchainAttachment[];
  public readonly proposal: T; // this may not be populated if the comment was loaded before the proposal!
  public readonly id: number;
  public readonly createdAt: moment.Moment;
  public readonly community?: string;
  public readonly authorChain?: string;
  public readonly parentComment: number;
  public readonly rootProposal: number;
  public readonly childComments: number[];
  public readonly versionHistory: string[];

  constructor(
    chain,
    author,
    text,
    plaintext,
    versionHistory,
    attachments,
    proposal,
    id,
    createdAt,
    childComments = [],
    rootProposal,
    parentComment?,
    community?,
    authorChain?
  ) {
    this.chain = chain;
    this.author = author;
    this.text = text;
    this.plaintext = plaintext;
    this.versionHistory = versionHistory;
    this.attachments = attachments;
    this.proposal = proposal;
    this.id = id;
    this.createdAt = createdAt;
    this.childComments = childComments;
    this.parentComment = parentComment;
    this.rootProposal = rootProposal;
    this.community = community;
    this.authorChain = authorChain;
  }
}

export default OffchainComment;

import moment from 'moment';
import { VersionHistory } from '../controllers/server/threads';
import { IUniqueId } from './interfaces';
import Attachment from './Attachment';

class Comment<T extends IUniqueId> {
  [x: string]: any;
  public readonly chain: string;
  public readonly author: string;
  public readonly text: string;
  public readonly plaintext: string;
  public readonly attachments: Attachment[];
  public readonly proposal: T; // this may not be populated if the comment was loaded before the proposal!
  public readonly id: number;
  public readonly createdAt: moment.Moment;
  public readonly authorChain?: string;
  public readonly parentComment: number;
  public readonly rootProposal: string;
  public readonly versionHistory: VersionHistory[];
  public readonly lastEdited: moment.Moment;
  public readonly deleted: boolean;

  constructor({
    chain,
    author,
    text,
    plaintext,
    versionHistory,
    attachments,
    proposal,
    id,
    createdAt,
    rootProposal,
    // optional args
    parentComment,
    authorChain,
    lastEdited, // moment.Moment
    deleted,
  }) {
    this.chain = chain;
    this.author = author;
    this.text = text;
    this.plaintext = plaintext;
    this.versionHistory = versionHistory;
    this.attachments = attachments;
    this.proposal = proposal;
    this.id = id;
    this.createdAt = createdAt;
    this.parentComment = parentComment;
    this.rootProposal = rootProposal;
    this.authorChain = authorChain;
    this.lastEdited = lastEdited;
    this.deleted = deleted;
  }
}

export default Comment;

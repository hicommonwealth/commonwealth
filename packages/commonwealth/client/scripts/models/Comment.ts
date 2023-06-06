import type moment from 'moment';
import type { VersionHistory } from '../controllers/server/threads';
import type Attachment from './Attachment';
import type { IUniqueId } from './interfaces';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class Comment<T extends IUniqueId> {
  [x: string]: any;

  public readonly chain: string;
  public readonly author: string;
  public readonly text: string;
  public readonly plaintext: string;
  public readonly attachments: Attachment[];
  public readonly id: number;
  public readonly createdAt: moment.Moment;
  public readonly authorChain?: string;
  public readonly parentComment: number;
  public readonly threadId: number;
  public readonly versionHistory: VersionHistory[];
  public readonly lastEdited: moment.Moment;
  public readonly markedAsSpamAt: moment.Moment;
  public readonly deleted: boolean;

  public readonly canvasAction: string;
  public readonly canvasSession: string;
  public readonly canvasHash: string;

  constructor({
    chain,
    author,
    text,
    plaintext,
    versionHistory,
    attachments,
    id,
    createdAt,
    threadId,
    // optional args
    parentComment,
    authorChain,
    lastEdited, // moment.Moment
    markedAsSpamAt, // moment.Moment
    deleted,
    canvasAction,
    canvasSession,
    canvasHash,
  }) {
    this.chain = chain;
    this.author = author;
    this.text = text;
    this.plaintext = plaintext;
    this.versionHistory = versionHistory;
    this.attachments = attachments;
    this.threadId = threadId;
    this.id = id;
    this.createdAt = createdAt;
    this.parentComment = parentComment;
    this.authorChain = authorChain;
    this.lastEdited = lastEdited;
    this.markedAsSpamAt = markedAsSpamAt;
    this.deleted = deleted;
    this.canvasAction = canvasAction;
    this.canvasSession = canvasSession;
    this.canvasHash = canvasHash;
  }
}

export default Comment;

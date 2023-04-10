import type moment from 'moment';
import type { VersionHistory } from '../controllers/server/threads';
import type Attachment from './Attachment';
import type { IUniqueId } from './interfaces';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class Comment<T extends IUniqueId> {
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
  public readonly deleted: boolean;

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
    deleted,
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
    this.deleted = deleted;
  }
}

export default Comment;

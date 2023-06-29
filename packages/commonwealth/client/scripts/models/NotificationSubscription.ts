import { modelFromServer as modelCommentFromServer } from 'controllers/server/comments';
import moment from 'moment';

import type { SubscriptionInstance } from 'server/models/subscription';
import app from '../state';
import type { Comment as CommentT } from './Comment';
import type { IUniqueId } from './interfaces';
import { Thread as ThreadT } from './Thread';

class NotificationSubscription {
  public readonly category: string;
  public readonly createdAt: moment.Moment;
  public readonly chainId: string;
  public readonly Comment: CommentT<IUniqueId>;
  public readonly Thread: ThreadT;
  public readonly snapshotId: string;

  public readonly id?: number;
  public readonly chainEntityId?: any;

  private _immediateEmail: boolean;
  public get immediateEmail() {
    return this._immediateEmail;
  }

  public enableImmediateEmail() {
    this._immediateEmail = true;
  }

  public disableImmediateEmail() {
    this._immediateEmail = false;
  }

  private _isActive: boolean;
  public get isActive() {
    return this._isActive;
  }

  public enable() {
    this._isActive = true;
  }

  public disable() {
    this._isActive = false;
  }

  constructor(
    id,
    category,
    isActive,
    createdAt,
    immediateEmail,
    chainId?,
    comment?: CommentT<IUniqueId>,
    thread?: ThreadT,
    snapshotId?: string
  ) {
    this.id = id;
    this.category = category;
    this._isActive = isActive;
    this.createdAt = moment(createdAt);
    this._immediateEmail = immediateEmail;
    this.chainId = chainId;
    this.Comment = comment;
    this.Thread = thread;
    this.snapshotId = snapshotId;
  }

  public static fromJSON(json) {
    return new NotificationSubscription(
      json.id,
      json.category_id,
      json.is_active,
      json.created_at,
      json.immediate_email,
      json.chain_id,
      json.Comment || json.offchain_comment_id,
      json.Thread || json.thread_id,
      json.snapshot_id
    );
  }
}

export const modelFromServer = (subscription: SubscriptionInstance) => {
  const {
    id,
    category_id,
    is_active,
    created_at,
    immediate_email,
    Chain,
    Comment,
    Thread,
    snapshot_id,
  } = subscription;

  let modeledThread: ThreadT;

  if (Thread) {
    try {
      modeledThread = app.threads.modelFromServer(Thread);
    } catch (e) {
      console.log('error', e);
    }
  }

  let modeledComment: CommentT<IUniqueId>;

  if (Comment) {
    try {
      modeledComment = modelCommentFromServer(Comment);
    } catch (e) {
      console.log('error', e);
    }
  }

  return new NotificationSubscription(
    id,
    category_id,
    is_active,
    created_at,
    immediate_email,
    Chain?.id || Chain,
    modeledComment,
    modeledThread,
    snapshot_id
  );
};

export default NotificationSubscription;

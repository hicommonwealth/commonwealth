import { modelFromServer as modelCommentFromServer } from 'controllers/server/comments';
import moment from 'moment';

import type { SubscriptionInstance } from 'server/models/subscription';
import app from '../state';
import type ChainInfo from './ChainInfo';
import type { Comment as CommentT } from './Comment';
import type { IUniqueId } from './interfaces';
import { Thread as ThreadT } from './Thread';
import { SubscriptionFindOptions } from 'subscriptionMapping';

class NotificationSubscription implements SubscriptionFindOptions {
  public readonly category: string;
  public readonly snapshotId: string;
  public readonly createdAt: moment.Moment;
  public readonly Chain: ChainInfo;
  public readonly Comment: CommentT<IUniqueId>;
  public readonly Thread: ThreadT;

  public readonly id?: number;

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
  public disable() {
    this._isActive = false;
  }

  public enable() {
    this._isActive = true;
  }

  public get isActive() {
    return this._isActive;
  }

  // TODO: @Timothee these types need to be consolidated - ideally viewSubscriptions route doesn't fetch
  //  threads and comments so only id's like `viewNotifications` route
  public get chainId() {
    return this.Chain.id || <string>(<unknown>this.Chain);
  }

  public get threadId() {
    return this.Thread.id || <number>(<unknown>this.Thread);
  }

  public get commentId() {
    return this.Comment.id || <number>(<unknown>this.Comment);
  }

  constructor(
    id,
    category,
    isActive,
    createdAt,
    immediateEmail,
    Chain?,
    comment?: CommentT<IUniqueId>,
    thread?: ThreadT,
    snapshotId?: string
  ) {
    this.id = id;
    this.category = category;
    this._isActive = isActive;
    this.createdAt = moment(createdAt);
    this._immediateEmail = immediateEmail;
    this.Chain = Chain;
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
      json.Chain,
      json.Comment,
      json.Thread,
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
    Chain,
    modeledComment,
    modeledThread,
    snapshot_id
  );
};

export default NotificationSubscription;

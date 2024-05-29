import { Subscription } from '@hicommonwealth/schemas';
import moment from 'moment';
import { z } from 'zod';
import { Comment as CommentT } from './Comment';
import { Thread as ThreadT } from './Thread';
import type { IUniqueId } from './interfaces';

class NotificationSubscription {
  public readonly category: string;
  public readonly snapshotId: string;
  public readonly createdAt: moment.Moment;
  public readonly communityId?: string;
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

  public get threadId() {
    return this.Thread?.id;
  }

  public get commentId() {
    return this.Comment?.id;
  }

  public get categoryId() {
    return this.category;
  }

  constructor(
    id: number,
    category: string,
    isActive: boolean,
    createdAt: Date,
    immediateEmail: boolean,
    communityId?: string,
    comment?: CommentT<IUniqueId>,
    thread?: ThreadT,
    snapshotId?: string,
  ) {
    this.id = id;
    this.category = category;
    this._isActive = isActive;
    this.createdAt = moment(createdAt);
    this._immediateEmail = immediateEmail;
    this.communityId = communityId;
    this.Comment = comment;
    this.Thread = thread;
    this.snapshotId = snapshotId;
  }
}

export const modelFromServer = (
  subscription: z.infer<typeof Subscription> & {
    Thread?: any;
    Comment?: any;
  },
) => {
  const {
    id,
    category_id,
    is_active,
    created_at,
    immediate_email,
    community_id,
    Comment,
    Thread,
    snapshot_id,
  } = subscription;

  let modeledThread: ThreadT;

  if (Thread) {
    try {
      // The `Thread` var here uses /server/models/thread.ts as its type
      // and we are modeling it to /client/scripts/models/Thread.ts so
      // using any here to avoid lint error.
      modeledThread = new ThreadT(Thread as any);
    } catch (e) {
      console.log('error', e);
    }
  }

  let modeledComment: CommentT<IUniqueId>;

  if (Comment) {
    try {
      modeledComment = new CommentT({ ...Comment });
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
    community_id,
    modeledComment,
    modeledThread,
    snapshot_id,
  );
};

export default NotificationSubscription;

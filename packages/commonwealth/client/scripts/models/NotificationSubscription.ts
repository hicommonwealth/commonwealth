import moment from 'moment';

import type { SubscriptionInstance } from 'server/models/subscription';
import DeliveryMechanism from './DeliveryMechanism';
import type ChainInfo from './ChainInfo';
import { default as CommentT } from './Comment';
import { Thread as ThreadT } from './Thread';
import type { IUniqueId } from './interfaces';

interface SubscriptionDelivery {
  type: string;
  enabled: boolean;
}

class NotificationSubscription {
  public readonly category: string;
  public readonly snapshotId: string;
  public readonly createdAt: moment.Moment;
  public readonly Chain: ChainInfo;
  public readonly Comment: CommentT<IUniqueId>;
  public readonly Thread: ThreadT;
  public readonly SubscriptionDelivery: SubscriptionDelivery[];

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

  public enableDeliveryOption(deliveryMechType: string) {
    const deliveryOption = this.SubscriptionDelivery.find(
      (dm) => dm.type === deliveryMechType
    );
    if (deliveryOption) {
      deliveryOption.enabled = true;
    } else {
      this.SubscriptionDelivery.push({ type: deliveryMechType, enabled: true });
    }
  }

  public disableDeliveryOption(deliveryMechType: string) {
    const deliveryOption = this.SubscriptionDelivery.find(
      (dm) => dm.type === deliveryMechType
    );
    if (deliveryOption) {
      deliveryOption.enabled = false;
    }
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

  public get chainId() {
    return this.Chain?.id;
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
    id,
    category,
    isActive,
    createdAt,
    immediateEmail,
    SubscriptionDelivery?: SubscriptionDelivery[],
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
    this.SubscriptionDelivery = SubscriptionDelivery || [];
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
      json.SubscriptionDelivery || [],
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
    SubscriptionDelivery,
    Chain,
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
      modeledComment = new CommentT({ ...Comment } as any);
    } catch (e) {
      console.log('error', e);
    }
  }
  const modeledSubscriptionDeliveries: SubscriptionDelivery[] =
    SubscriptionDelivery.map((subDelivery) => ({
      type: subDelivery.DeliveryMechanism.type,
      enabled: subDelivery.DeliveryMechanism.enabled,
    }));

  return new NotificationSubscription(
    id,
    category_id,
    is_active,
    created_at,
    immediate_email,
    modeledSubscriptionDeliveries,
    Chain,
    modeledComment,
    modeledThread,
    snapshot_id
  );
};

export default NotificationSubscription;

import moment from 'moment-twitter';

class NotificationSubscription {
  public readonly id: number;
  public readonly category: string;
  public readonly objectId: string;
  public readonly createdAt: moment.Moment;

  private _immediateEmail: boolean;
  public get immediateEmail() { return this._immediateEmail; }
  public enableImmediateEmail() { this._immediateEmail = true; }
  public disableImmediateEmail() { this._immediateEmail = false; }

  private _isActive: boolean;
  public get isActive() { return this._isActive; }
  public enable() { this._isActive = true; }
  public disable() { this._isActive = false; }

  constructor(id, category, objectId, isActive, createdAt, immediateEmail) {
    this.id = id;
    this.category = category;
    this.objectId = objectId;
    this._isActive = isActive;
    this.createdAt = moment(createdAt);
    this._immediateEmail = immediateEmail;
  }

  public static fromJSON(json) {
    return new NotificationSubscription(
      json.id,
      json.category_id,
      json.object_id,
      json.is_active,
      json.created_at,
      json.immediate_email,
    );
  }
}

export default NotificationSubscription;

import moment from 'moment-twitter';

class NotificationSubscription {
  public readonly id: number;
  public readonly category: string;
  public readonly objectId: string;
  public readonly createdAt: moment.Moment;

  private _isActive: boolean;
  public get isActive() { return this._isActive; }
  public enable() { this._isActive = true; }
  public disable() { this._isActive = false; }

  constructor(id, category, objectId, isActive, createdAt) {
    this.id = id;
    this.category = category;
    this.objectId = objectId;
    this._isActive = isActive;
    this.createdAt = moment(createdAt);
  }

  public static fromJSON(json) {
    return new NotificationSubscription(
      json.id,
      json.category_id,
      json.object_id,
      json.is_active,
      json.created_at
    );
  }
}

export default NotificationSubscription;

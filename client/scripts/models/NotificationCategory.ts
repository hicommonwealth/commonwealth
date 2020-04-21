export class NotificationCategory {
  public readonly name: string;
  public readonly description: string;

  constructor(name, description) {
    this.name = name;
    this.description = description;
  }

  public static fromJSON(json) {
    return new NotificationCategory(json.name, json.description);
  }
}

export default NotificationCategory;

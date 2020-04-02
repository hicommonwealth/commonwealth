export class NotificationCategory {
  constructor(
    public readonly name: string,
    public readonly description: string
  ) { }
  public static fromJSON(json) {
    return new NotificationCategory(json.name, json.description);
  }
}

export default NotificationCategory;

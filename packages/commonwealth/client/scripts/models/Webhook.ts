import { WebhookCategory } from '@hicommonwealth/core';

class Webhook {
  public readonly id: number;
  public readonly url: string;
  public categories: WebhookCategory[];
  public readonly community_id?: string;

  constructor(
    id: number,
    url: string,
    categories: WebhookCategory[],
    community_id: string,
  ) {
    this.id = id;
    this.url = url;
    this.categories = categories;
    this.community_id = community_id;
  }

  public static fromJSON(json) {
    return new Webhook(json.id, json.url, json.categories, json.community_id);
  }
}

export default Webhook;

/**
 * This file was auto-generated by Fern from our API Definition.
 */
export interface CreateThreadResponseThreadVersionHistoriesItem {
  id?: number;
  threadId: number;
  /** Address of the creator of the post or the collaborator */
  address: string;
  body: string;
  timestamp: Date;
  contentUrl?: string;
}

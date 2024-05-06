export type ThreadDiscordActions =
  | 'thread-delete'
  | 'thread-title-update'
  | 'thread-body-update'
  | 'thread-create';

export type CommentDiscordActions =
  | 'comment-delete'
  | 'comment-update'
  | 'comment-create';

export type DiscordAction = ThreadDiscordActions | CommentDiscordActions;

export interface IDiscordMessage {
  user?: {
    id: string;
    username: string;
  };
  title?: string;
  content: string;
  message_id: string;
  channel_id?: string;
  parent_channel_id?: string;
  guild_id?: string;
  imageUrls?: string[];
  action: DiscordAction;
}

export interface IDiscordMeta {
  user: {
    id: string;
    username: string;
  };
  channel_id: string;
  message_id: string;
}

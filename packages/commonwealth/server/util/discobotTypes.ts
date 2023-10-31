export interface IDiscordMeta {
  user: {
    id: string,
    username: string,
  },
  channel_id: string,
  message_id: string,
  old_message_id?: string
}
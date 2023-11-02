import { Message } from 'discord.js';

export function getImageUrls(message: Partial<Message>) {
  if (!message.attachments) return [];
  const attachments = [...message.attachments.values()];

  return attachments
    .filter((attachment) => {
      return attachment.contentType.startsWith('image');
    })
    .map((attachment) => {
      return attachment.url;
    });
}

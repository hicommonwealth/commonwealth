import { Message, OmitPartialGroupDMChannel, PartialMessage } from 'discord.js';

export function getImageUrls(
  message:
    | OmitPartialGroupDMChannel<Message<boolean> | PartialMessage>
    | Message<boolean>
    | PartialMessage,
) {
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

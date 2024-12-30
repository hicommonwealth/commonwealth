export enum WebhookDestinations {
  Discord = 'discord',
  Slack = 'slack',
  Zapier = 'zapier',
  Telegram = 'telegram',
  Eliza = 'eliza',
  Unknown = 'unknown',
}

const ElizaWebhookUrlRegex = /^https:\/\/[^\/]+\/eliza\/\d+$/;

export function getWebhookDestination(webhookUrl = ''): WebhookDestinations {
  if (!/^https?:\/\/[^\s/$.?#].[^\s]*$/.test(webhookUrl))
    return WebhookDestinations.Unknown;

  let destination = WebhookDestinations.Unknown;
  if (
    webhookUrl.startsWith('https://discord.com/api/webhooks/') ||
    webhookUrl.startsWith('https://discordapp.com/api/webhooks/')
  )
    destination = WebhookDestinations.Discord;
  else if (webhookUrl.startsWith('https://hooks.slack.com/'))
    destination = WebhookDestinations.Slack;
  else if (webhookUrl.startsWith('https://hooks.zapier.com/'))
    destination = WebhookDestinations.Zapier;
  else if (webhookUrl.startsWith('https://api.telegram.org/@')) {
    const [, channelId] = webhookUrl.split('/@');
    if (!channelId) destination = WebhookDestinations.Unknown;
    else destination = WebhookDestinations.Telegram;
  } else if (ElizaWebhookUrlRegex.test(webhookUrl))
    destination = WebhookDestinations.Eliza;

  return destination;
}

export function getElizaUserId(webhookUrl: string): number {
  if (!ElizaWebhookUrlRegex.test(webhookUrl))
    throw new Error('Invalid Eliza webhook URL');
  const stringId = webhookUrl.split('/').pop()!;
  return parseInt(stringId, 10);
}

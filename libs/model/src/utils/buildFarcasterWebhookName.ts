export function buildFarcasterWebhookName(contestAddress: string) {
  return `fc-${contestAddress.slice(0, 6)}`;
}

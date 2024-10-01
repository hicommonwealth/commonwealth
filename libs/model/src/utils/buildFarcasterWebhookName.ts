export function buildFarcasterWebhookName(
  contestAddress: string,
  castHash: string,
) {
  return `farcaster-contest-webhook-${contestAddress}-${castHash}`;
}

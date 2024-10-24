export function buildFarcasterContestFrameUrl(contestAddress: string) {
  return `/api/integration/farcaster/contests/${contestAddress}/contestCard`;
}

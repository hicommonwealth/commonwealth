import type { SessionPayload } from '@canvas-js/interfaces';

export const createCanvasSessionPayload = (
  canvasChain: CanvasChain, // Canvas chain network, e.g. "ethereum"
  canvasChainId: string, // Canvas chain id, e.g. "1" or "osmo-1" (CW chainId is 1 or "osmo-1")
  from: string,
  sessionAddress: string,
  sessionIssued: number | null,
  block: string | null
): SessionPayload => {
  // This will be replaced with an IPFS hash
  const placeholderMultihash = '/commonwealth';

  // The blockhash is optional, but must be explicitly so
  if (block === undefined) throw new Error('Invalid Canvas signing message');

  const payload: SessionPayload = {
    app: placeholderMultihash,
    block: block === null ? null : block,
    chain: canvasChain,
    chainId: canvasChainId,
    from,
    sessionAddress,
    sessionDuration: 86400 * 1000,
    sessionIssued,
  };

  return payload;
};

import type {
  Chain as CanvasChain,
  SessionPayload,
} from '@canvas-js/interfaces';
import { ChainBase } from 'common-common/src/types';

/// An object with an identifier.
export interface IIdentifiable {
  identifier: string;
}

/// An object with an identifier and a completion flag.
export interface ICompletable extends IIdentifiable {
  completed: boolean;
}

export const constructCanvasMessage = (
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
    appName: 'Commonwealth',
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

export function chainBaseToCanvasChain(chainBase: ChainBase): CanvasChain {
  // Translate Commonwealth ChainBase names to Canvas Chain names.
  if (chainBase === ChainBase.CosmosSDK) {
    return 'cosmos';
  } else if (chainBase === ChainBase.Ethereum) {
    return 'ethereum';
  } else if (chainBase === ChainBase.NEAR) {
    return 'near';
  } else if (chainBase === ChainBase.Solana) {
    return 'solana';
  } else if (chainBase === ChainBase.Substrate) {
    return 'substrate';
  }
}

export function chainBaseToCanvasChainId(
  chainBase: ChainBase,
  idOrPrefix: string | number
): string {
  // The Canvas chain id is a stringified ETH chain ID, or Cosmos bech32 prefix, or equivalent.
  if (chainBase === ChainBase.CosmosSDK) {
    return idOrPrefix.toString();
  } else if (chainBase === ChainBase.Ethereum) {
    return idOrPrefix.toString();
  } else if (chainBase === ChainBase.NEAR) {
    // Temporarily locked to mainnet
    // See also: client/scripts/views/pages/finish_near_login.tsx
    return 'mainnet';
  } else if (chainBase === ChainBase.Solana) {
    // Temporarily locked to mainnet
    // See also: client/scripts/controllers/app/webWallets/phantom_web_wallet.ts
    return 'mainnet';
  } else if (chainBase === ChainBase.Substrate) {
    // Temporarily locked to generic Substrate chain id
    // See also: client/scripts/controllers/app/webWallets/polkadot_web_wallet.ts
    return '42';
  }
}

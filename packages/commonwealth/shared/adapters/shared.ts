import type {
  Block,
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
  chain: CanvasChain, // Canvas chain prefix, e.g. "eth"
  canvasChainId: string, // Canvas chain id, e.g. "1" or "osmo" (Note: CW chain id is 1 or "osmo-1")
  fromAddress: string,
  sessionPublicAddress: string,
  timestamp: number | null,
  blockhash: string | null
): SessionPayload => {
  // This will be replaced with an IPFS hash after turning on peering
  const placeholderMultihash = '/commonwealth';

  // Timestamp and blockhash are optional, but must be explicitly so.
  if (timestamp === undefined)
    throw new Error('Invalid Canvas signing message');
  if (blockhash === undefined)
    throw new Error('Invalid Canvas signing message');

  // Not all data here is used. For chains without block data
  // like Solana/Polkadot, timestamp is left blank in session login.
  //
  // This in cleaned up in the next PR which reconciles
  // Commonwealth to use the updated Canvas signing payload.
  const payload: SessionPayload = {
    from: fromAddress,
    spec: placeholderMultihash,
    address: sessionPublicAddress,
    duration: 86400 * 1000,
    timestamp: timestamp === null ? null : timestamp,
    blockhash: blockhash === null ? null : blockhash,
    chain: chain,
    chainId: canvasChainId,
  };

  return payload;
};

export function chainBaseToCanvasChain(chainBase: ChainBase): CanvasChain {
  // Translate Commonwealth ChainBase names to Canvas Chain names.
  if (chainBase === ChainBase.CosmosSDK) {
    return 'cosmos';
  } else if (chainBase === ChainBase.Ethereum) {
    return 'eth';
  } else if (chainBase === ChainBase.NEAR) {
    return 'near';
  } else if (chainBase === ChainBase.Solana) {
    return 'eth';
  } else if (chainBase === ChainBase.Substrate) {
    return 'substrate';
  }
}

interface IChainNodeish {
  ethChainId?: string | number;
}
interface IChainish {
  bech32Prefix: string;
  node: IChainNodeish;
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
    // Temporarily locked to edgeware, but eventually should support Substrate chains by ID
    // See also: client/scripts/controllers/app/webWallets/polkadot_web_wallet.ts
    return 'edgeware';
  }
}

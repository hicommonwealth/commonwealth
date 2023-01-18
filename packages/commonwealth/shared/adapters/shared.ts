import type { Chain, SessionPayload } from '@canvas-js/interfaces';
import { ChainBase } from 'common-common/src/types';

/// An object with an identifier.
export interface IIdentifiable {
  identifier: string;
}

/// An object with an identifier and a completion flag.
export interface ICompletable extends IIdentifiable {
  completed: boolean;
}

export type CanvasData = {
  loginTo: string;
  registerSessionAddress: string;
  registerSessionDuration: string;
  timestamp: string;
};

export const constructCanvasMessage = (
  chain: Chain,
  chainId: number | string,
  fromAddress: string,
  sessionPublicAddress: string,
  validationBlockInfoString: string
): CanvasData => {
  const placeholderMultihash = '/commonwealth';
  const validationBlockInfo = JSON.parse(validationBlockInfoString);

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
    timestamp: validationBlockInfo?.timestamp,
    blockhash: validationBlockInfo?.hash,
    chain: chain,
    chainId: chainId,
  };

  return {
    loginTo: payload.spec,
    registerSessionAddress: payload.address,
    registerSessionDuration: payload?.duration?.toString() ?? null,
    timestamp: payload?.timestamp?.toString() ?? null,
  };
};

export function chainBasetoCanvasChain(chainBase: ChainBase): Chain {
  /*
  Translate the commonwealth ChainBase names to canvas Chain names.
  */
  if (chainBase == ChainBase.CosmosSDK) {
    return 'cosmos';
  } else if (chainBase == ChainBase.Ethereum) {
    return 'eth';
  } else if (chainBase == ChainBase.NEAR) {
    return 'near';
  } else if (chainBase == ChainBase.Solana) {
    return 'eth';
  } else if (chainBase == ChainBase.Substrate) {
    return 'substrate';
  }
}

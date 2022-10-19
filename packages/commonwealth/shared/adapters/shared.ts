import type { Block, Chain, SessionPayload } from '@canvas-js/interfaces';

/// An object with an identifier.
export interface IIdentifiable {
  identifier: string;
}

/// An object with an identifier and a completion flag.
export interface ICompletable extends IIdentifiable {
  completed: boolean;
}

export type CanvasData = {
  loginTo: string
  registerSessionAddress: string
  registerSessionDuration: string
  timestamp: string
}

export const constructCanvasMessage = (
  chain: Chain,
  chainId: number | string,
  fromAddress: string,
  sessionPublicAddress: string,
  validationBlockInfoString: string
): CanvasData => {
  const placeholderMultihash = '/commonwealth'; // TODO
  const validationBlockInfo = JSON.parse(validationBlockInfoString)

  const block: Block = {
    chain: chain,
    // @ts-ignore
    chainId: chainId,
    blocknum: validationBlockInfo.number,
    blockhash: validationBlockInfo.hash,
    timestamp: validationBlockInfo.timestamp,
  };

  // use the block timestamp as the message timestamp, since the block should
  // have been requested recently
  const payload: SessionPayload = {
    from: fromAddress,
    spec: placeholderMultihash,
    address: sessionPublicAddress,
    duration: 86400 * 1000,
    timestamp: block.timestamp,
    block,
  };

  return {
    loginTo: payload.spec,
    registerSessionAddress: payload.address,
    registerSessionDuration: payload.duration.toString(),
    timestamp: payload.timestamp.toString(),
  };
}

import { utils, ethers } from 'ethers';
import type { Block, SessionPayload } from '@canvas-js/interfaces';
import { TypedDataDomain, TypedDataField } from "@ethersproject/abstract-signer"

export const TEST_BLOCK_INFO_STRING = '{"number":1,"hash":"0x0f927bde6fb00940895178da0d32948714ea6e76f6374f03ffbbd7e0787e15bf","timestamp":1665083987891}';

export const constructTypedMessage = async (fromAddress: string, fromChainId: number, sessionPublicAddress: string, validationBlockInfoString: string) => {
  const placeholderMultihash = '/commonwealth'; // TODO

  const validationBlockInfo = JSON.parse(validationBlockInfoString)
  const block: Block = {
    chain: 'eth',
    chainId: fromChainId,
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

  // construct the signature data from scratch, since canvas' implementation doesn't
  // include an EIP712Domain
  const domain: TypedDataDomain = {
    name: "Commonwealth",
  };

  const types: Record<string, TypedDataField[]> = {
    EIP712Domain: [
      { name: 'name', type: 'string' },
    ],
    Message: [
      { name: "loginTo", type: "string" },
      { name: "registerSessionAddress", type: "string" },
      { name: "registerSessionDuration", type: "uint256" },
      { name: "timestamp", type: "uint256" },
    ],
  };

  const message = {
    loginTo: payload.spec,
    registerSessionAddress: payload.address,
    registerSessionDuration: payload.duration.toString(),
    timestamp: payload.timestamp.toString(),
  };

  // canvas uses ethers' signTypedData types while commonwealth uses eth-sig-util's
  // so we have to coerce the types here
  return { types, primaryType: 'Message', domain, message } as any;
};

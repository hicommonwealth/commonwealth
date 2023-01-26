import { utils } from 'ethers';
import type {
  TypedDataDomain,
  TypedDataField,
} from '@ethersproject/abstract-signer';
import type { Block, SessionPayload } from '@canvas-js/interfaces';

export const TEST_BLOCK_INFO_STRING =
  '{"number":1,"hash":"0x0f927bde6fb00940895178da0d32948714ea6e76f6374f03ffbbd7e0787e15bf","timestamp":1665083987891}';
export const TEST_BLOCK_INFO_BLOCKHASH =
  '0x0f927bde6fb00940895178da0d32948714ea6e76f6374f03ffbbd7e0787e15bf';

export const constructTypedCanvasMessage = (message) => {
  // construct the signature data from scratch, since canvas' implementation doesn't
  // include an EIP712Domain
  const domain: TypedDataDomain = {
    name: 'Commonwealth',
    salt: utils.hexlify(0),
  };

  const types: Record<string, TypedDataField[]> = {
    EIP712Domain: [{ name: 'name', type: 'string' }],
    Message: [
      { name: 'app', type: 'string' },
      { name: 'block', type: 'string' },
      { name: 'chain', type: 'string' },
      { name: 'chainId', type: 'string' },
      { name: 'from', type: 'string' },
      { name: 'sessionAddress', type: 'string' },
      { name: 'sessionDuration', type: 'uint256' },
      { name: 'sessionIssued', type: 'uint256' },
    ],
  };

  // canvas uses ethers' signTypedData types while commonwealth uses eth-sig-util's
  // so we have to coerce the types here
  return { types, primaryType: 'Message', domain, message } as any;
};

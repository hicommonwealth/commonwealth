import type { SessionPayload } from '@canvas-js/interfaces';
import type {
  TypedDataDomain,
  TypedDataField,
} from '@ethersproject/abstract-signer';
import { getSessionSignatureData } from '@canvas-js/chain-ethereum';

export const TEST_BLOCK_INFO_STRING =
  '{"number":1,"hash":"0x0f927bde6fb00940895178da0d32948714ea6e76f6374f03ffbbd7e0787e15bf","timestamp":1665083987891}';
export const TEST_BLOCK_INFO_BLOCKHASH =
  '0x0f927bde6fb00940895178da0d32948714ea6e76f6374f03ffbbd7e0787e15bf';

export const constructTypedCanvasMessage = (message: SessionPayload) => {
  const [, ethersTypes, value]: [
    unknown,
    Record<string, TypedDataField[]>,
    SessionPayload
  ] = getSessionSignatureData(message);

  // Commonwealth uses web3.js for `metamask_web_wallet` and
  // `walletconnect_web_wallet`, so we reset and inject EIP712Domain
  // into types:
  const domain = { name: 'Commonwealth' };
  const types = {
    EIP712Domain: [{ name: 'name', type: 'string' }],
    Message: ethersTypes.Message,
  };

  // Return types compatible with eth-sig-util.
  return { types, primaryType: 'Message', domain, message };
};

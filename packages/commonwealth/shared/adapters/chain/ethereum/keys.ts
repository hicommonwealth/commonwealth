import type { SessionPayload } from '@canvas-js/interfaces';
import type { TypedMessage, MessageTypes } from '@metamask/eth-sig-util';

export const TEST_BLOCK_INFO_STRING =
  '{"number":1,"hash":"0x0f927bde6fb00940895178da0d32948714ea6e76f6374f03ffbbd7e0787e15bf","timestamp":1665083987891}';
export const TEST_BLOCK_INFO_BLOCKHASH =
  '0x0f927bde6fb00940895178da0d32948714ea6e76f6374f03ffbbd7e0787e15bf';

export const constructTypedCanvasMessage = (
  message: SessionPayload
): TypedMessage<MessageTypes> => {
  // canvas implements ethers.js eip712 types, but
  // commonwealth uses web3.js which expects the
  // user to provide a valid EIP712Domain
  //
  // see: https://github.com/ethers-io/ethers.js/issues/687#issuecomment-714069471
  const domain = { name: 'Commonwealth' };

  const types = {
    EIP712Domain: [{ name: 'name', type: 'string' }],
    Message: [
      { name: 'app', type: 'string' },
      { name: 'appName', type: 'string' },
      { name: 'block', type: 'string' },
      { name: 'chain', type: 'string' },
      { name: 'chainId', type: 'string' },
      { name: 'from', type: 'string' },
      { name: 'sessionAddress', type: 'string' },
      { name: 'sessionDuration', type: 'uint256' },
      { name: 'sessionIssued', type: 'uint256' },
    ],
  };

  // these return types match what's expected by `eth-sig-util`
  return { types, primaryType: 'Message', domain, message };
};

import type { ActionPayload, SessionPayload } from '@canvas-js/interfaces';
import type { TypedMessage, MessageTypes } from '@metamask/eth-sig-util';
import { configure as configureStableStringify } from 'safe-stable-stringify';
import * as siwe from 'siwe';

const sortedStringify = configureStableStringify({
  bigint: false,
  circularValue: Error,
  strict: true,
  deterministic: true,
});

export const TEST_BLOCK_INFO_STRING =
  '{"number":1,"hash":"0x0f927bde6fb00940895178da0d32948714ea6e76f6374f03ffbbd7e0787e15bf","timestamp":1665083987891}';
export const TEST_BLOCK_INFO_BLOCKHASH =
  '0x0f927bde6fb00940895178da0d32948714ea6e76f6374f03ffbbd7e0787e15bf';

export const getEIP712SignableAction = (
  message: ActionPayload
): TypedMessage<MessageTypes> => {
  // canvas implements ethers.js eip712 types, but
  // commonwealth uses web3.js which expects the
  // user to provide a valid EIP712Domain
  //
  // see: https://github.com/ethers-io/ethers.js/issues/687#issuecomment-714069471
  const domain = { name: '/commonwealth' };

  const types = {
    EIP712Domain: [{ name: 'name', type: 'string' }],
    Message: [
      { name: 'app', type: 'string' },
      { name: 'block', type: 'string' },
      { name: 'call', type: 'string' },
      { name: 'callArgs', type: 'string' },
      { name: 'chain', type: 'string' },
      { name: 'from', type: 'string' },
      { name: 'timestamp', type: 'uint64' },
    ],
  };

  // these return types match what's expected by `eth-sig-util`
  return {
    types,
    primaryType: 'Message',
    domain,
    message: { ...message, callArgs: sortedStringify(message.callArgs) },
  };
};

export const SiweMessageVersion = '1';

const chainPattern = /^eip155:(\d+)$/;

export function createSiweMessage(
  payload: SessionPayload,
  domain: string,
  nonce: string
) {
  const chainPatternMatch = chainPattern.exec(payload.chain);
  if (chainPatternMatch === null) {
    throw new Error(
      `invalid chain: ${payload.chain} did not match ${chainPattern}`
    );
  }

  const [_, chainId] = chainPatternMatch;

  const message = new siwe.SiweMessage({
    version: SiweMessageVersion,
    domain: new URL(domain).host,
    nonce: nonce,
    address: payload.from,
    uri: domain,
    chainId: parseInt(chainId),
    issuedAt: new Date(payload.sessionIssued).toISOString(),
    expirationTime: new Date(
      payload.sessionIssued + payload.sessionDuration
    ).toISOString(),
    resources: [`ethereum:${payload.sessionAddress}:${payload.app}`],
  });

  return message.prepareMessage();
}

import type { Action, Message, Session } from '@canvas-js/interfaces';
import { CANVAS_TOPIC } from 'canvas';

import { WalletSsoSource } from '@hicommonwealth/core';
import { CanvasSignedData } from 'shared/canvas/types';
import { getSessionSigners } from 'shared/canvas/verify';
import Account from '../../models/Account';
import IWebWallet from '../../models/IWebWallet';

export class SessionKeyError extends Error {
  readonly address: string;
  readonly ssoSource: WalletSsoSource;

  constructor({ name, message, address, ssoSource }) {
    super(message);
    this.name = name;
    this.address = address;
    this.ssoSource = ssoSource;
  }
}

export async function signSessionWithAccount<T extends { address: string }>(
  wallet: IWebWallet<T>,
  account: Account,
  timestamp: number,
) {
  const session = await getSessionFromWallet(wallet, { timestamp });
  const walletAddress = session.address.split(':')[2];
  if (walletAddress !== account.address) {
    throw new Error(
      `Session signed with wrong address ('${walletAddress}', expected '${account.address}')`,
    );
  }
  return session;
}

export const getMagicCosmosSessionSigner = async (
  signer: { signMessage: any },
  address: string,
  chainId: string,
) => {
  const { CosmosSigner } = await import('@canvas-js/chain-cosmos');
  return new CosmosSigner({
    signer: {
      type: 'amino',
      getAddress: async () => address,
      getChainId: async () => chainId,
      signAmino: async (chainIdIgnore, signerIgnore, signDoc) => {
        const { msgs, fee } = signDoc;
        return {
          signed: signDoc,
          signature: await signer.signMessage(msgs, fee),
        };
      },
    },
  });
};

export async function getSessionFromWallet(
  wallet: IWebWallet<any>,
  opts?: { timestamp?: number },
) {
  const sessionSigner = await wallet.getSessionSigner();
  const session = await sessionSigner.getSession(CANVAS_TOPIC, {
    timestamp: opts?.timestamp,
  });
  return session;
}

// Sign an arbitrary action, using context from the last authSession() call.
//
// The signing methods are stateful, which simplifies implementation greatly
// because we always request an authSession immediately before signing.
// The user should never be able to switch accounts in the intervening time.
async function sign(
  address_: string,
  call: string,
  args: any,
): Promise<CanvasSignedData> {
  // TODO: REPLACE THIS - this is a temporary solution to get the signer to sign the message
  // We should have some way to get the CAIP-2 style address
  const address = `eip155:1:${address_}`;
  const sessionSigners = await getSessionSigners();
  for (const signer of sessionSigners) {
    if (signer.match(address)) {
      // assume for now that we are using SIWESigner
      // TODO: add getCachedSession for other session signers
      const { session } = signer.getCachedSession(CANVAS_TOPIC, address);

      const sessionMessage: Message<Session> = {
        clock: 0,
        parents: [],
        topic: CANVAS_TOPIC,
        payload: session,
      };

      const sessionMessageSignature = await signer.sign(sessionMessage);

      const actionMessage: Message<Action> = {
        clock: 0,
        parents: [],
        topic: CANVAS_TOPIC,
        payload: {
          type: 'action' as const,
          address,
          blockhash: null,
          name: call,
          args,
          timestamp: Date.now(),
        },
      };

      const actionMessageSignature = await signer.sign(actionMessage);

      return {
        sessionMessage,
        sessionMessageSignature,
        actionMessage,
        actionMessageSignature,
      };
    }
  }
  throw new Error(`No signer found for address ${address}`);
}

// Public signer methods
export async function signThread(
  address: string,
  { community, title, body, link, topic },
) {
  return await sign(address, 'thread', {
    community: community || '',
    title: encodeURIComponent(title),
    body: encodeURIComponent(body),
    link: link || '',
    topic: topic || '',
  });
}

export async function signDeleteThread(address: string, { thread_id }) {
  return await sign(address, 'deleteThread', {
    thread_id,
  });
}

export async function signComment(
  address: string,
  { thread_id, body, parent_comment_id },
) {
  return await sign(address, 'comment', {
    thread_id,
    body: encodeURIComponent(body),
    parent_comment_id,
  });
}

export async function signDeleteComment(address: string, { comment_id }) {
  return await sign(address, 'deleteComment', {
    comment_id,
  });
}

export async function signThreadReaction(address: string, { thread_id, like }) {
  const value = like ? 'like' : 'dislike';
  return await sign(address, 'reactThread', {
    thread_id,
    value,
  });
}

export async function signDeleteThreadReaction(address: string, { thread_id }) {
  return await sign(address, 'unreactThread', {
    thread_id,
  });
}

export async function signCommentReaction(
  address: string,
  { comment_id, like },
) {
  const value = like ? 'like' : 'dislike';
  return await sign(address, 'reactComment', {
    comment_id,
    value,
  });
}

export async function signDeleteCommentReaction(
  address: string,
  { comment_id },
) {
  return await sign(address, 'unreactComment', {
    comment_id,
  });
}

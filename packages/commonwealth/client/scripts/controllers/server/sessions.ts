import type { Action, Message, Session } from '@canvas-js/interfaces';
import { CANVAS_TOPIC } from 'canvas';

import { ChainBase, WalletSsoSource } from '@hicommonwealth/shared';
import { encode } from '@ipld/dag-json';
import { sha256 } from '@noble/hashes/sha256';
import app from 'client/scripts/state';
import {
  chainBaseToCaip2,
  chainBaseToCanvasChainId,
} from 'shared/canvas/chainMappings';
import { CosmosSignerCW } from 'shared/canvas/sessionSigners';
import { CanvasSignResult } from 'shared/canvas/types';
import { getSessionSigners } from 'shared/canvas/verify';
import { addressSwapper } from 'shared/utils';
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
) {
  const session = await getSessionFromWallet(wallet);
  const walletAddress = session.address.split(':')[2];
  if (walletAddress !== account.address) {
    throw new Error(
      `Session signed with wrong address ('${walletAddress}', expected '${account.address}')`,
    );
  }
  return session;
}

export const getMagicCosmosSessionSigner = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signer: { signMessage: any },
  address: string,
  chainId: string,
) => {
  return new CosmosSignerCW({
    signer: {
      type: 'amino',
      getAddress: () => address,
      getChainId: () => chainId,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wallet: IWebWallet<any>,
) {
  const sessionSigner = await wallet.getSessionSigner();
  let session = await sessionSigner.getSession(CANVAS_TOPIC);

  if (session == null) {
    session = await sessionSigner.newSession(CANVAS_TOPIC);
  }

  return session.payload;
}

function getCaip2Address(address: string) {
  const caip2Prefix = chainBaseToCaip2(app.chain.base);

  const idOrPrefix =
    app.chain.base === ChainBase.CosmosSDK
      ? app.chain?.meta.bech32Prefix || 'cosmos'
      : app.chain?.meta.node?.ethChainId || 1;
  const canvasChainId = chainBaseToCanvasChainId(app.chain.base, idOrPrefix);

  return `${caip2Prefix}:${canvasChainId}:${address}`;
}

// Sign an arbitrary action, using context from the last authSession() call.
//
// The signing methods are stateful, which simplifies implementation greatly
// because we always request an authSession immediately before signing.
// The user should never be able to switch accounts in the intervening time.
async function sign(
  address_: string,
  call: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any,
): Promise<CanvasSignResult> {
  const address = getCaip2Address(address_);
  const sessionSigners = getSessionSigners();
  for (const signer of sessionSigners) {
    if (signer.match(address)) {
      let lookupAddress = address;

      const [chainBaseFromAddress, chainIdFromAddress, walletAddress] =
        address.split(':');

      // if using polkadot, we need to convert the address so that it has the prefix 42
      if (chainBaseFromAddress === 'polkadot') {
        const swappedWalletAddress = addressSwapper({
          address: walletAddress,
          currentPrefix: 42,
        });
        lookupAddress = `polkadot:${chainIdFromAddress}:${swappedWalletAddress}`;
      }

      const savedData = await signer.getSession(CANVAS_TOPIC, {
        address: lookupAddress,
      });
      if (!savedData) {
        throw new SessionKeyError({
          name: 'Authentication Error',
          message: `No session found for address ${address}`,
          address,
          ssoSource: WalletSsoSource.Unknown,
        });
      }
      const { payload: session, signer: messageSigner } = savedData;

      // check if session is expired
      if (session.duration !== null) {
        const sessionExpirationTime = session.timestamp + session.duration;
        if (Date.now() > sessionExpirationTime) {
          throw new SessionKeyError({
            name: 'Authentication Error',
            message: `Session expired for address ${address}`,
            address,
            ssoSource: WalletSsoSource.Unknown,
          });
        }
      }

      const sessionMessage: Message<Session> = {
        clock: 0,
        parents: [],
        topic: CANVAS_TOPIC,
        payload: session,
      };

      const sessionMessageSignature = await messageSigner.sign(sessionMessage);

      const actionMessage: Message<Action> = {
        clock: 0,
        parents: [],
        topic: CANVAS_TOPIC,
        payload: {
          type: 'action' as const,
          address: session.address,
          blockhash: null,
          name: call,
          args,
          timestamp: Date.now(),
        },
      };

      const actionMessageSignature = await messageSigner.sign(actionMessage);

      return {
        canvasSignedData: {
          sessionMessage,
          sessionMessageSignature,
          actionMessage,
          actionMessageSignature,
        },
        canvasHash: Buffer.from(sha256(encode(actionMessage))).toString('hex'),
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

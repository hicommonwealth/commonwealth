import { SignedMessage } from '@canvas-js/gossiplog';
import type { Action, Message, Session } from '@canvas-js/interfaces';
import {
  CANVAS_TOPIC,
  CanvasSignResult,
  ChainBase,
  CosmosSignerCW,
  WalletSsoSource,
  addressSwapper,
  chainBaseToCaip2,
  chainBaseToCanvasChainId,
  getSessionSigners,
} from '@hicommonwealth/shared';
import axios from 'axios';
import app from 'state';
import { SERVER_URL } from 'state/api/config';
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
  const walletAddress = session.did.split(':')[4];
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
  { newSession }: { newSession: boolean } = { newSession: false },
) {
  const sessionSigner = await wallet.getSessionSigner();

  if (newSession) {
    const { payload } = await sessionSigner.newSession(CANVAS_TOPIC);
    return payload;
  }

  const session = await sessionSigner.getSession(CANVAS_TOPIC);
  if (session) {
    return session.payload;
  } else {
    const { payload } = await sessionSigner.newSession(CANVAS_TOPIC);
    return payload;
  }
}

function getDidForCurrentAddress(address: string) {
  const caip2Prefix = chainBaseToCaip2(app.chain.base);

  const idOrPrefix =
    app.chain.base === ChainBase.CosmosSDK
      ? app.chain?.meta.bech32Prefix || 'cosmos'
      : app.chain?.meta?.node?.ethChainId || 1;
  const canvasChainId = chainBaseToCanvasChainId(app.chain.base, idOrPrefix);

  return `did:pkh:${caip2Prefix}:${canvasChainId}:${address}`;
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
): Promise<CanvasSignResult | null> {
  const did = getDidForCurrentAddress(address_);
  const sessionSigners = getSessionSigners();
  for (const signer of sessionSigners) {
    if (signer.match(did)) {
      let lookupDid = did;

      const [, , chainBaseFromAddress, chainIdFromAddress, walletAddress] =
        did.split(':');

      // if using polkadot, we need to convert the address so that it has the prefix 42
      if (chainBaseFromAddress === 'polkadot') {
        const swappedWalletAddress = addressSwapper({
          address: walletAddress,
          currentPrefix: 42,
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        lookupDid = `did:pkh:polkadot:${chainIdFromAddress}:${swappedWalletAddress}`;
      }

      const savedSessionMessage = await signer.getSession(CANVAS_TOPIC, {
        did,
      });

      if (!savedSessionMessage) {
        throw new SessionKeyError({
          name: 'Authentication Error',
          message: `No session found for ${did}`,
          address: walletAddress,
          ssoSource: WalletSsoSource.Unknown,
        });
      }
      const { payload: session, signer: messageSigner } = savedSessionMessage;

      // check if session is expired
      if (session.context.duration) {
        const sessionExpirationTime =
          session.context.timestamp + session.context.duration;
        if (Date.now() > sessionExpirationTime) {
          throw new SessionKeyError({
            name: 'Authentication Error',
            message: `Session expired for ${did}`,
            address: walletAddress,
            ssoSource: WalletSsoSource.Unknown,
          });
        }
      }

      // get the clock and parents from the backend
      const response = await axios.get(`${SERVER_URL}/getCanvasClock`);
      const { clock, heads: parents } = response.data.result;

      const sessionMessage: Message<Session> = {
        clock,
        parents,
        topic: CANVAS_TOPIC,
        payload: session,
      };

      const sessionMessageSignature = await messageSigner.sign(sessionMessage);
      const sessionMessageId = SignedMessage.encode(
        sessionMessageSignature,
        sessionMessage,
      ).id;

      const actionMessage: Message<Action> = {
        clock: clock + 1,
        parents: [sessionMessageId],
        topic: CANVAS_TOPIC,
        payload: {
          type: 'action' as const,
          did: session.did,
          context: {
            timestamp: Date.now(),
          },
          name: call,
          args,
        },
      };

      const actionMessageSignature = await messageSigner.sign(actionMessage);
      const actionMessageId = SignedMessage.encode(
        actionMessageSignature,
        actionMessage,
      ).id;

      return {
        canvasSignedData: {
          sessionMessage,
          sessionMessageSignature,
          actionMessage,
          actionMessageSignature,
        },
        canvasMsgId: actionMessageId,
      };
    }
  }
  throw new Error(`No signer found for ${did}`);
}

// Public signer methods
// TODO: rename all these to `createSignThreadAction()` or similar
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

export async function signUpdateThread(
  address: string,
  { thread_id, title, body, link, topic },
) {
  return await sign(address, 'updateThread', {
    thread_id,
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

export async function signUpdateComment(address: string, { comment_id, body }) {
  return await sign(address, 'updateComment', {
    comment_id,
    body: encodeURIComponent(body),
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

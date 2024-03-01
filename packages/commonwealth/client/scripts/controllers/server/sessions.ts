import type { Signature } from '@canvas-js/interfaces';
import { CANVAS_TOPIC } from 'canvas';

import { CosmosSigner } from '@canvas-js/chain-cosmos';
import { WalletSsoSource } from '@hicommonwealth/core';
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

export const getMagicCosmosSessionSigner = (
  signer: { signMessage: any },
  address: string,
  chainId: string,
) =>
  new CosmosSigner({
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

class SessionsController {
  // Sign an arbitrary action, using context from the last authSession() call.
  //
  // The signing methods are stateful, which simplifies implementation greatly
  // because we always request an authSession immediately before signing.
  // The user should never be able to switch accounts in the intervening time.
  private async sign(
    address: string,
    call: string,
    args: any,
  ): Promise<Signature> {
    const sessionSigners = await getSessionSigners();
    for (const signer of sessionSigners) {
      if (signer.match(address)) {
        return signer.sign({
          clock: 0,
          parents: [],
          payload: {
            type: 'action',
            address,
            blockhash: null,
            name: call,
            args,
            timestamp: Date.now(),
          },
          topic: CANVAS_TOPIC,
        });
      }
    }
    throw new Error(`No signer found for address ${address}`);
  }

  // Public signer methods
  public async signThread(
    address: string,
    { community, title, body, link, topic },
  ) {
    const { session, action, hash } = await this.sign(address, 'thread', {
      community: community || '',
      title: encodeURIComponent(title),
      body: encodeURIComponent(body),
      link: link || '',
      topic: topic || '',
    });
    return { session, action, hash };
  }

  public async signDeleteThread(address: string, { thread_id }) {
    const { session, action, hash } = await this.sign(address, 'deleteThread', {
      thread_id,
    });
    return { session, action, hash };
  }

  public async signComment(
    address: string,
    { thread_id, body, parent_comment_id },
  ) {
    const { session, action, hash } = await this.sign(address, 'comment', {
      thread_id,
      body: encodeURIComponent(body),
      parent_comment_id,
    });
    return { session, action, hash };
  }

  public async signDeleteComment(address: string, { comment_id }) {
    const { session, action, hash } = await this.sign(
      address,
      'deleteComment',
      {
        comment_id,
      },
    );
    return { session, action, hash };
  }

  public async signThreadReaction(address: string, { thread_id, like }) {
    const value = like ? 'like' : 'dislike';
    const { session, action, hash } = await this.sign(address, 'reactThread', {
      thread_id,
      value,
    });
    return { session, action, hash };
  }

  public async signDeleteThreadReaction(address: string, { thread_id }) {
    const { session, action, hash } = await this.sign(
      address,
      'unreactThread',
      {
        thread_id,
      },
    );
    return { session, action, hash };
  }

  public async signCommentReaction(address: string, { comment_id, like }) {
    const value = like ? 'like' : 'dislike';
    const { session, action, hash } = await this.sign(address, 'reactComment', {
      comment_id,
      value,
    });
    return { session, action, hash };
  }

  public async signDeleteCommentReaction(address: string, { comment_id }) {
    const { session, action, hash } = await this.sign(
      address,
      'unreactComment',
      {
        comment_id,
      },
    );
    return { session, action, hash };
  }
}

export default SessionsController;

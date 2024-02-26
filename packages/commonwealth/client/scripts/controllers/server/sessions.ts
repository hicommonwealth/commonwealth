import { addressSwapper } from 'commonwealth/shared/utils';

import type { ActionArgument, Session } from '@canvas-js/interfaces';
import { getADR036SignableSession } from 'adapters/chain/cosmos/keys';
import { createSiweMessage } from 'adapters/chain/ethereum/keys';
import {
  CANVAS_TOPIC,
  chainBaseToCanvasChainId,
  createCanvasSessionPayload,
} from 'canvas';

import { SIWESigner } from '@canvas-js/chain-ethereum';
import { ChainBase, WalletSsoSource } from '@hicommonwealth/core';
import app from 'state';
import Account from '../../models/Account';
import IWebWallet from '../../models/IWebWallet';
import {
  // CosmosSDKSessionController,
  EthereumSessionController,
  ISessionController,
  NEARSessionController,
  SolanaSessionController,
  SubstrateSessionController,
} from './sessionSigners';

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
  // TODO: what do we do with did/caip?
  const walletAddress = session.address.split(':')[2];
  if (walletAddress !== account.address) {
    throw new Error(
      `Session signed with wrong address ('${walletAddress}', expected '${account.address}')`,
    );
  }
  return session;
}

// for eth and cosmos only, assumes chainbase is either Ethereum or CosmosSDK
export async function signSessionWithMagic(
  walletChain = ChainBase.Ethereum,
  signer,
  signerAddress,
  timestamp: number,
  blockhash = '',
) {
  const idOrPrefix =
    walletChain === ChainBase.CosmosSDK
      ? app.chain?.meta.bech32Prefix || 'cosmos'
      : app.chain?.meta.node?.ethChainId || 1;
  const canvasChainId = chainBaseToCanvasChainId(walletChain, idOrPrefix);
  const sessionPublicAddress = await app.sessions.getOrCreateAddress(
    walletChain,
    canvasChainId,
    signerAddress,
  );

  const sessionPayload = createCanvasSessionPayload(
    walletChain,
    canvasChainId,
    walletChain === ChainBase.Substrate
      ? addressSwapper({
          address: signerAddress,
          currentPrefix: 42,
        })
      : signerAddress,
    sessionPublicAddress,
    timestamp,
    blockhash,
  );

  // skip wallet.signCanvasMessage(), do the logic here instead
  if (walletChain === ChainBase.CosmosSDK) {
    const canvas = await import('@canvas-js/interfaces');
    const { msgs, fee } = await getADR036SignableSession(
      Buffer.from(canvas.serializeSessionPayload(sessionPayload)),
      signerAddress,
    );
    const signature = await signer.signMessage(msgs, fee); // this is a cosmos tx
    return { signature, sessionPayload };
  } else {
    // signature format: https://docs.canvas.xyz/docs/formats#ethereum
    const siwe = await require('siwe');
    const nonce = siwe.generateNonce();
    const domain = document.location.origin;
    const message = createSiweMessage(sessionPayload, domain, nonce);
    const signatureData = await signer.signMessage(message);
    return { signature: `${domain}/${nonce}/${signatureData}`, sessionPayload };
  }
}

export async function getSessionFromWallet(
  wallet: IWebWallet<any>,
  opts?: { timestamp?: number },
) {
  const sessionSigner = await wallet.getSessionSigner();
  const session = await sessionSigner.getSession(CANVAS_TOPIC, {
    timestamp: opts.timestamp,
  });
  return session;
}

// TODO: create the full list of these
// do we know all of the session signers?
// should chainId actually be in the constructor?
const sessionSigners = [new SIWESigner()];

export function verifySession(session: Session) {
  for (const signer of sessionSigners) {
    if (signer.match(session.address)) {
      return signer.verifySession(CANVAS_TOPIC, session);
    }
  }
  throw new Error(
    `No signer found for session with address ${session.address}`,
  );
}

class SessionsController {
  ethereum: EthereumSessionController;
  substrate: SubstrateSessionController;
  // cosmos: CosmosSDKSessionController;
  solana: SolanaSessionController;
  near: NEARSessionController;

  constructor() {
    this.ethereum = new EthereumSessionController();
    this.substrate = new SubstrateSessionController();
    // this.cosmos = new CosmosSDKSessionController();
    this.solana = new SolanaSessionController();
    this.near = new NEARSessionController();
  }

  getSessionController(chainBase: ChainBase): ISessionController {
    if (chainBase === 'ethereum') return this.ethereum;
    else if (chainBase === 'substrate') return this.substrate;
    // else if (chainBase === 'cosmos') return this.cosmos;
    else if (chainBase === 'solana') return this.solana;
    else if (chainBase === 'near') return this.near;
  }

  // Get a session address. Generate one and cache in localStorage if none exists.
  public getOrCreateAddress(
    chainBase: ChainBase,
    chainId: string,
    fromAddress: string,
  ): Promise<string> {
    return this.getSessionController(chainBase).getOrCreateAddress(
      chainId,
      fromAddress,
    );
  }

  // Sign an arbitrary action, using context from the last authSession() call.
  //
  // The signing methods are stateful, which simplifies implementation greatly
  // because we always request an authSession immediately before signing.
  // The user should never be able to switch accounts in the intervening time.
  private async sign(
    address: string,
    call: string,
    args: Record<string, ActionArgument>,
  ): Promise<{ session: string; action: string; hash: string }> {
    const chainBase = app.chain?.base;

    // Try to infer Chain ID from the currently active chain. Note that
    // `chainBaseToCanvasChainId` replaces idOrPrefix with the appropriate
    // chainID for non-eth, non-cosmos chains.
    const idOrPrefix =
      chainBase === ChainBase.CosmosSDK
        ? app.chain?.meta.bech32Prefix
        : app.chain?.meta.node?.ethChainId;
    const canvasChainId = chainBaseToCanvasChainId(chainBase, idOrPrefix);

    // Try to request a new session from the user, if one was not found.
    const controller = this.getSessionController(chainBase);

    // Load any past session
    const hasAuthenticatedSession = await controller.hasAuthenticatedSession(
      canvasChainId,
      address,
    );

    // Get a new session signature.
    if (app.config.enforceSessionKeys && !hasAuthenticatedSession) {
      const matchingAccount = app.user.addresses.find(
        (a) => a.address === address,
      );

      throw new SessionKeyError({
        name: 'Authentication Error',
        message: 'Session key expired',
        address,
        ssoSource: matchingAccount.walletSsoSource,
      });
    }

    if (!hasAuthenticatedSession) {
      return { session: '', action: '', hash: '' };
    }

    const { session, action, hash } = await controller.sign(
      canvasChainId,
      address,
      call,
      args,
    );

    return {
      session: JSON.stringify(session),
      action: JSON.stringify(action),
      hash,
    };
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

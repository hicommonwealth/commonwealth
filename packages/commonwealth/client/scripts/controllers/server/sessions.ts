import type { ActionArgument, SessionPayload } from '@canvas-js/interfaces';

import { chainBaseToCanvasChain, chainBaseToCanvasChainId, constructCanvasMessage, } from 'adapters/shared';
import { addressSwapper } from 'commonwealth/shared/utils';

import app from 'state';
import { ChainBase } from '../../../../../common-common/src/types';
import type IWebWallet from '../../models/IWebWallet';
import type { ISessionController } from './sessionSigners';
import {
  CosmosSDKSessionController,
  EthereumSessionController,
  NEARSessionController,
  SolanaSessionController,
  SubstrateSessionController,
} from './sessionSigners';

export async function signSessionWithAccount<T extends { address: string }>(
  wallet: IWebWallet<T>,
  account: Account,
  timestamp: number
) {
  // Try to infer Chain ID from the currently active chain.
  // `chainBaseToCanvasChainId` will replace idOrPrefix with the
  // appropriate chainID for non-eth, non-cosmos chains.
  //
  // However, also handle the case where app.chain is empty.
  const idOrPrefix =
    wallet.chain === ChainBase.CosmosSDK
      ? app.chain?.meta.bech32Prefix || 'cosmos'
      : app.chain?.meta.node?.ethChainId || 1;
  const canvasChain = chainBaseToCanvasChain(wallet.chain);
  const canvasChainId = chainBaseToCanvasChainId(wallet.chain, idOrPrefix);
  const sessionPublicAddress = await app.sessions.getOrCreateAddress(
    wallet.chain,
    canvasChainId
  );

  const canvasMessage = constructCanvasMessage(
    canvasChain,
    canvasChainId,
    wallet.chain === ChainBase.Substrate
      ? addressSwapper({
          address: account.address,
          currentPrefix: 42,
        })
      : account.address,
    sessionPublicAddress,
    timestamp,
    account.validationBlockInfo
      ? JSON.parse(account.validationBlockInfo).hash
      : null
  );

  const signature = await wallet.signCanvasMessage(account, canvasMessage);
  return { signature, chainId: canvasChainId, sessionPayload: canvasMessage };
}

class SessionsController {
  ethereum: EthereumSessionController;
  substrate: SubstrateSessionController;
  cosmos: CosmosSDKSessionController;
  solana: SolanaSessionController;
  near: NEARSessionController;

  constructor() {
    this.ethereum = new EthereumSessionController();
    this.substrate = new SubstrateSessionController();
    this.cosmos = new CosmosSDKSessionController();
    this.solana = new SolanaSessionController();
    this.near = new NEARSessionController();
  }

  getSessionController(chainBase: ChainBase): ISessionController {
    if (chainBase == 'ethereum') return this.ethereum;
    else if (chainBase == 'substrate') return this.substrate;
    else if (chainBase == 'cosmos') return this.cosmos;
    else if (chainBase == 'solana') return this.solana;
    else if (chainBase == 'near') return this.near;
  }

  // Get a session address. Generate one and cache in localStorage if none exists.
  public getOrCreateAddress(
    chainBase: ChainBase,
    chainId: string
  ): Promise<string> {
    return this.getSessionController(chainBase).getOrCreateAddress(chainId);
  }

  // Provide authentication for a session address, by presenting a signed SessionPayload.
  public authSession(
    chainBase: ChainBase,
    chainId: string,
    payload: SessionPayload,
    signature: string
  ) {
    return this.getSessionController(chainBase).authSession(
      chainId,
      payload,
      signature
    );
  }

  // Sign an arbitrary action, using context from the last authSession() call.
  private async sign(
    call: string,
    args: Record<string, ActionArgument>
  ): Promise<{ session: string; action: string; hash: string }> {
    const chainBase = app.chain?.base;

    // Try to infer Chain ID from the currently active chain. Note that
    // `chainBaseToCanvasChainId` replaces idOrPrefix with the appropriate
    // chainID for non-eth, non-cosmos chains.
    const idOrPrefix =
      chainBase == ChainBase.CosmosSDK
        ? app.chain?.meta.bech32Prefix
        : app.chain?.meta.node?.ethChainId;
    const chainId = chainBaseToCanvasChainId(chainBase, idOrPrefix);

    // Try to request a new session from the user, if one was not found.
    const controller = this.getSessionController(chainBase);

    // Load any past session
    const hasAuthenticatedSession = await controller.hasAuthenticatedSession(
      chainId
    );

    // TODO: Turn on the session sign-in modal
    if (!hasAuthenticatedSession) {
      return {
        session: JSON.stringify({}),
        action: JSON.stringify({}),
        hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      };
      // await sessionSigninModal().catch((err) => {
      //   console.log('Login failed');
      //   throw err;
      // });
    }

    const { session, action, hash } = await controller.sign(
      chainId,
      call,
      args
    );

    return {
      session: JSON.stringify(session),
      action: JSON.stringify(action),
      hash,
    };
  }

  // Public signer methods
  public async signThread({ community, title, body, link, topic }) {
    const { session, action, hash } = await this.sign('thread', {
      community: community || '',
      title,
      body,
      link: link || '',
      topic: topic || '',
    });
    return { session, action, hash };
  }

  public async signDeleteThread({ thread_id }) {
    const { session, action, hash } = await this.sign('deleteThread', {
      thread_id,
    });
    return { session, action, hash };
  }

  public async signComment({ thread_id, body, parent_comment_id }) {
    const { session, action, hash } = await this.sign('comment', {
      thread_id,
      body,
      parent_comment_id,
    });
    return { session, action, hash };
  }

  public async signDeleteComment({ comment_id }) {
    const { session, action, hash } = await this.sign('deleteComment', {
      comment_id,
    });
    return { session, action, hash };
  }

  public async signThreadReaction({ thread_id, like }) {
    const value = like ? 'like' : 'dislike';
    const { session, action, hash } = await this.sign('reactThread', {
      thread_id,
      value,
    });
    return { session, action, hash };
  }

  public async signDeleteThreadReaction({ thread_id }) {
    const { session, action, hash } = await this.sign('unreactThread', {
      thread_id,
    });
    return { session, action, hash };
  }

  public async signCommentReaction({ comment_id, like }) {
    const value = like ? 'like' : 'dislike';
    const { session, action, hash } = await this.sign('reactComment', {
      comment_id,
      value,
    });
    return { session, action, hash };
  }

  public async signDeleteCommentReaction({ comment_id }) {
    const { session, action, hash } = await this.sign('unreactComment', {
      comment_id,
    });
    return { session, action, hash };
  }
}

export default SessionsController;

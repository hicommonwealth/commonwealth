// export { CosmosSDKSessionController } from './cosmos';
export { EthereumSessionController } from './ethereum';
export { NEARSessionController } from './near';
export { SolanaSessionController } from './solana';
export { SubstrateSessionController } from './substrate';

import type { Action, ActionArgument, Session } from '@canvas-js/interfaces';

export class InvalidSession extends Error {}

export abstract class ISessionController {
  // Get the current user's human-readable session address.
  abstract getAddress(chainId: string, fromAddress: string): string | null;

  // Check whether the current user has an authenticated session stored locally.
  abstract hasAuthenticatedSession(
    chainId: string,
    fromAddress: string,
  ): Promise<boolean>;

  // Get the current user's human-readable session address,
  // and generate an unsigned session if it doesn't exist yet.
  abstract getOrCreateAddress(
    chainId: string,
    fromAddress: string,
  ): Promise<string>;

  // Authenticate a session by submitting a signature.
  abstract authSession(session: Session): void;

  // Sign an action, using the current authenticated session.
  abstract sign(
    chainId: string,
    fromAddress: string,
    call: string,
    args: Record<string, ActionArgument>,
  ): Promise<{
    session: Session;
    action: Action;
    hash: string;
  }>;
}

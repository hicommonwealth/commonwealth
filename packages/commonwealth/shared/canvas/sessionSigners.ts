import { CosmosSigner } from '@canvas-js/chain-cosmos';
import { SolanaSigner } from '@canvas-js/chain-solana';
import { SubstrateSigner } from '@canvas-js/chain-substrate';

/**
 * In Canvas, the default behaviour is that a SessionSigner saves a session key in localStorage for
 * each combination of chain base (e.g. "cosmos", "ethereum", "substrate"), chain id and address.
 *
 * This is not ideal for Commonwealth, where the chain id is not always known, e.g. with Cosmos.
 *
 * In these cases we want to override the default behaviour and store one session for all chains.
 * We can do this by overriding the `getSessionKey` method of the session signer class (e.g. CosmosSigner).
 */

export class CosmosSignerCW extends CosmosSigner {
  protected getSessionKey = (topic: string, address: string) => {
    const walletAddress = address.split(':')[2];
    const cwAddress = `cosmos:cosmoshub-1:${walletAddress}`;
    return `canvas/${topic}/${cwAddress}`;
  };
}

export class SubstrateSignerCW extends SubstrateSigner {
  protected getSessionKey = (topic: string, address: string) => {
    const walletAddress = address.split(':')[2];
    const cwAddress = `polkadot:42:${walletAddress}`;
    return `canvas/${topic}/${cwAddress}`;
  };
}

export class SolanaSignerCW extends SolanaSigner {
  protected getSessionKey = (topic: string, address: string) => {
    const walletAddress = address.split(':')[2];
    const cwAddress = `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:${walletAddress}`;
    return `canvas/${topic}/${cwAddress}`;
  };
}

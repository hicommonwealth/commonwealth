/**
 * In Canvas, the default behaviour is that a SessionSigner saves a session key in localStorage for
 * each combination of chain base (e.g. "cosmos", "ethereum", "substrate"), chain id and address.
 *
 * This is not ideal for Commonwealth, where the chain id is not always known, e.g. with Cosmos.
 *
 * In these cases we want to override the default behaviour and store one session for all chains.
 * We can do this by overriding the `getSessionKey` method of the session signer class (e.g. CosmosSigner).
 */

export async function constructCosmosSignerCWClass() {
  // The modified CosmosSigner class is imported from the @canvas-js/chain-cosmos package
  // which is an ESM module, so we have to wrap the class definition in an async function

  const { CosmosSigner } = await import('@canvas-js/chain-cosmos');

  class CosmosSignerCW extends CosmosSigner {
    protected getSessionKey = (topic: string, address: string) => {
      const walletAddress = address.split(':')[2];
      const cwAddress = `cosmos:cosmoshub-1:${walletAddress}`;
      return `canvas/${topic}/${cwAddress}`;
    };
  }
  return CosmosSignerCW;
}

export async function constructSubstrateSignerCWClass() {
  const { SubstrateSigner } = await import('@canvas-js/chain-substrate');

  class SubstrateSignerCW extends SubstrateSigner {
    protected getSessionKey = (topic: string, address: string) => {
      const walletAddress = address.split(':')[2];
      const cwAddress = `polkadot:42:${walletAddress}`;
      return `canvas/${topic}/${cwAddress}`;
    };
  }

  return SubstrateSignerCW;
}

export async function constructSolanaSignerCWClass() {
  const { SolanaSigner } = await import('@canvas-js/chain-solana');

  class SolanaSignerCW extends SolanaSigner {
    protected getSessionKey = (topic: string, address: string) => {
      const walletAddress = address.split(':')[2];
      const cwAddress = `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:${walletAddress}`;
      return `canvas/${topic}/${cwAddress}`;
    };
  }

  return SolanaSignerCW;
}

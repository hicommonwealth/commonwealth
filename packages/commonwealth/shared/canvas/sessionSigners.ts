import { CosmosSigner } from '@canvas-js/chain-cosmos';
import { SubstrateSigner } from '@canvas-js/chain-substrate';
import { AbstractSessionData, Session } from '@canvas-js/interfaces';
import { fromBech32, toBech32 } from '@cosmjs/encoding';
import { addressSwapper } from 'shared/utils';

/**
 * In Canvas, the default behaviour is that a SessionSigner saves a session key in localStorage for
 * each combination of chain base (e.g. "cosmos", "ethereum", "substrate"), chain id and address.
 *
 * This is not ideal for Commonwealth, where the chain id is not always known, e.g. with Cosmos.
 *
 * In these cases we want to override the default behaviour and store one session for all chains.
 * We can do this by overriding the `getAddress` method of the session signer class (e.g. CosmosSigner).
 */

function parseAddress(address: string): [chain: string, walletAddress: string] {
  const addressPattern = /^cosmos:([0-9a-z\-_]+):([a-zA-Fa-f0-9]+)$/;
  const result = addressPattern.exec(address);
  if (result === null) {
    throw new Error(
      `invalid address: ${address} did not match ${addressPattern}`,
    );
  }

  const chain = result[1];
  const walletAddress = result[2];
  return [chain, walletAddress];
}

export class CosmosSignerCW extends CosmosSigner {
  public async getAddress(): Promise<string> {
    const chainId = await this._signer.getChainId();
    const walletAddress = await this._signer.getAddress(chainId);
    const { data } = fromBech32(walletAddress);
    const walletAddressWithPrefix = toBech32(this.bech32Prefix, data);
    return `cosmos:cosmoshub-1:${walletAddressWithPrefix}`;
  }

  // Use this._signer.getChainId() instead of the chainId inferred from the CAIP-2 address
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async authorize(data: AbstractSessionData): Promise<Session<any>> {
    const { topic, address, timestamp, publicKey, duration } = data;
    const [chainId, walletAddress] = parseAddress(address);

    const issuedAt = new Date(timestamp);
    const message = {
      topic: topic,
      address: walletAddress,
      chainId,
      publicKey: publicKey,
      issuedAt: issuedAt.toISOString(),
      expirationTime: null,
    };

    if (duration !== null) {
      // @ts-expect-error <StrictNullChecks>
      message.expirationTime = new Date(timestamp + duration).toISOString();
    }

    const signResult = await this._signer.sign(
      message,
      walletAddress,
      await this._signer.getChainId(),
    );

    return {
      type: 'session',
      address: address,
      publicKey: publicKey,
      authorizationData: signResult,
      blockhash: null,
      timestamp: timestamp,
      duration: duration,
    };
  }
}

export class SubstrateSignerCW extends SubstrateSigner {
  // override SubstrateSigner to always use 42 as the ss58 id
  // TODO: Could we pass the ss58prefix to this._signer.getAddress()
  // in packages/chain-substrate instead?
  public async getAddress(): Promise<string> {
    const walletAddress = await this._signer.getAddress();
    const finalAddress = addressSwapper({
      currentPrefix: 42,
      address: walletAddress,
    });
    return `polkadot:42:${finalAddress}`;
  }

  // override AbstractSessionSigner to use ss58 id 42 in hasSession
  hasSession(topic, address) {
    const [namespace, chainId, walletAddress] = address.split(':');
    const finalAddress = addressSwapper({
      currentPrefix: 42,
      address: walletAddress,
    });
    const key = `canvas/${topic}/${namespace}:${chainId}:${finalAddress}`;
    return this.target.get(key) !== null;
    // return this.#cache.has(key) || target.get(key) !== null
  }
}

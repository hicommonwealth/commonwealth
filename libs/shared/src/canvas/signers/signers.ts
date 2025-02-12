import { CosmosSigner } from '@canvas-js/chain-cosmos';
import { SIWESigner, SIWFSigner } from '@canvas-js/chain-ethereum';
import { SolanaSigner } from '@canvas-js/chain-solana';
import { SubstrateSigner } from '@canvas-js/chain-substrate';
import {
  AbstractSessionData,
  Action,
  DidIdentifier,
  Session,
  Signer,
  Snapshot,
} from '@canvas-js/interfaces';
import { fromBech32, toBech32 } from '@cosmjs/encoding';
import { addressSwapper } from '@hicommonwealth/shared';
import * as json from '@ipld/dag-json';
import { KeypairType } from '@polkadot/util-crypto/types';
import { Wallet } from 'ethers';

export const getTestSigner = () => {
  return new SIWESigner({ signer: Wallet.createRandom() });
};

export const getSessionSigners = () => {
  return [
    new SIWESigner(),
    new SIWFSigner(),
    new CosmosSignerCW(),
    new SubstrateSignerCW({ extension: null, prefix: 42 }),
    new SolanaSigner(),
  ];
};

export const getAddressFromDid = (did: string) => {
  if (did.startsWith('did:pkh:farcaster:')) {
    return did.split(':')[3];
  } else {
    return did.split(':')[4];
  }
};

export const getSessionSignerForDid = (address: string) => {
  const sessionSigners = getSessionSigners();
  for (const signer of sessionSigners) {
    if (signer.match(address)) return signer;
  }
};

/**
 * In Canvas, the default behaviour is that a SessionSigner saves a
 * session key in localStorage for each combination of chain base
 * (e.g. "cosmos", "ethereum", "substrate"), chain id and address.
 * For Commonwealth, the chain id is not always known, so we want to
 * always use `cosmos` as the chain ID for cosmos, and `42` for
 * substrate, etc.
 *
 * In these cases we want to override the default behaviour and store
 * one session for all chains.  We can do this by overriding the
 * `getDid` method of the session signer class (e.g. CosmosSigner).
 */

function parseCosmosAddress(
  address: string,
): [chain: string, walletAddress: string] {
  const addressPattern = /^did:pkh:cosmos:([0-9a-z\-_]+):([a-zA-Fa-f0-9]+)$/;
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

/**
 * Use addresses of the form `did:pkh:cosmos:cosmoshub-1:osmo1...`
 * since we don't know the chain ID, but also don't want to reencode the chain address
 */
export class CosmosSignerCW extends CosmosSigner {
  public async getDid(): Promise<DidIdentifier> {
    const chainId = await this._signer.getChainId();
    const walletAddress = await this._signer.getAddress(chainId);
    const { data } = fromBech32(walletAddress);
    const walletAddressWithPrefix = toBech32(this.bech32Prefix, data);
    return `did:pkh:cosmos:cosmoshub-1:${walletAddressWithPrefix}`;
  }

  // Use this._signer.getChainId() instead of the chain id inferred from the DID
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async authorize(data: AbstractSessionData): Promise<Session<any>> {
    const {
      topic,
      did,
      publicKey,
      context: { timestamp, duration },
    } = data;
    const [chainId, walletAddress] = parseCosmosAddress(did);

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
      did: did,
      publicKey: publicKey,
      authorizationData: signResult,
      context: duration
        ? {
            timestamp: timestamp,
            duration: duration,
          }
        : {
            timestamp: timestamp,
          },
    };
  }
}

/**
 * Use addresses of the form `did:pkh:polkadot:42:mL6f72...`.
 * Substrate and Polkadot chains are even more complicated;
 * they also reencode the *address* differently for each chain.
 */

export type SubstrateMessage = {
  topic: string;
  address: string;
  chainId: string;
  uri: string;
  issuedAt: string;
  expirationTime: string | null;
};

export type SubstrateSessionData = {
  signatureResult: {
    signature: Uint8Array;
    nonce: Uint8Array;
  };
  substrateKeyType: KeypairType;
  data: SubstrateMessage;
};

export class SubstrateSignerCW extends SubstrateSigner {
  private prefix: number;

  constructor({ extension, prefix = 42 }: { extension: any; prefix?: number }) {
    super({ extension });
    this.prefix = prefix;
    console.log('SubstrateSignerCW - Constructor - Prefix:', prefix);
    console.log('SubstrateSignerCW - Constructor - Extension:', extension);

    // Initialize signer if extension is provided
    if (extension?.signer) {
      this._signer = extension.signer;
    } else if (extension) {
      this._signer = extension;
    }

    if (!this._signer) {
      console.error('SubstrateSignerCW - Constructor - No signer available');
    }
  }

  public async getDid(): Promise<DidIdentifier> {
    console.log('SubstrateSignerCW - GetDid - Starting');
    if (!this._signer) {
      console.error('SubstrateSignerCW - GetDid - No signer available');
      throw new Error('No signer available');
    }
    const walletAddress = await this._signer.getAddress();
    console.log(
      'SubstrateSignerCW - GetDid - Original wallet address:',
      walletAddress,
    );

    const finalAddress = addressSwapper({
      currentPrefix: this.prefix,
      address: walletAddress,
    });
    console.log('SubstrateSignerCW - GetDid - Final address:', finalAddress);
    console.log('SubstrateSignerCW - GetDid - Using prefix:', this.prefix);

    const did = `did:pkh:polkadot:${this.prefix}:${finalAddress}` as const;
    console.log('SubstrateSignerCW - GetDid - Generated DID:', did);
    return did;
  }

  // override AbstractSessionSigner to use ss58 id 42
  public async getSession(
    topic: string,
    options: { did?: string; address?: string } = {},
  ): Promise<{
    payload: Session<SubstrateSessionData>;
    signer: Signer<Action | Snapshot | Session<SubstrateSessionData>>;
  } | null> {
    console.log(
      'SubstrateSignerCW - GetSession - Starting with options:',
      options,
    );

    if (!this._signer) {
      console.error('SubstrateSignerCW - GetSession - No signer available');
      return null;
    }

    let did;
    if (options.address) {
      console.log(
        'SubstrateSignerCW - GetSession - Using address option:',
        options.address,
      );
      const dids = this.listSessions(topic).filter((d) =>
        d.endsWith(':' + options.address),
      );
      if (dids.length === 0) {
        console.log('SubstrateSignerCW - GetSession - No matching DIDs found');
        return null;
      }
      did = dids[0];
      console.log('SubstrateSignerCW - GetSession - Found matching DID:', did);
    } else {
      did = await Promise.resolve(options.did ?? this.getDid());
      console.log(
        'SubstrateSignerCW - GetSession - Generated/provided DID:',
        did,
      );
    }

    const didParts = did.split(':');
    const walletAddress = didParts[4];
    console.log(
      'SubstrateSignerCW - GetSession - Extracted wallet address:',
      walletAddress,
    );

    const finalAddress = addressSwapper({
      currentPrefix: this.prefix,
      address: walletAddress,
    });
    console.log(
      'SubstrateSignerCW - GetSession - Final address after swap:',
      finalAddress,
    );

    did = `did:pkh:polkadot:${this.prefix}:${finalAddress}` as const;
    console.log('SubstrateSignerCW - GetSession - Final DID:', did);

    const key = `canvas/${topic}/${did}`;
    console.log('SubstrateSignerCW - GetSession - Storage key:', key);

    const value = this.target.get(key);
    if (value !== null) {
      console.log('SubstrateSignerCW - GetSession - Found existing session');
      const entry = json.parse<{
        type: string;
        privateKey: Uint8Array;
        session: Session;
      }>(value);
      const { type, privateKey, session } = entry;
      console.log('SubstrateSignerCW - GetSession - Session type:', type);

      const signer = this.scheme.create({ type, privateKey });
      return { payload: session, signer };
    }

    console.log('SubstrateSignerCW - GetSession - No session found');
    return null;
  }

  hasSession(topic: string, address: string) {
    // TODO: we should have a utility function to access parts of DIDs
    const addressParts = address.split(':');
    const walletAddress = addressParts[4];
    const finalAddress = addressSwapper({
      currentPrefix: this.prefix,
      address: walletAddress,
    });
    const did = `did:pkh:polkadot:${this.prefix}:${finalAddress}`;
    const key = `canvas/${topic}/${did}`;
    return this.target.get(key) !== null;
    // return this.#cache.has(key) || target.get(key) !== null
  }
}

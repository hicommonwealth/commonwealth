import { Keyring } from '@polkadot/api';
import { IKeyringPair } from '@polkadot/types/types';
import { mnemonicGenerate, signatureVerify } from '@polkadot/util-crypto';
import { actionToHash } from 'helpers/canvas';
import {
  Action,
  ActionPayload,
  ActionArgument,
  Session,
  SessionPayload,
} from '@canvas-js/interfaces';
import { ISessionController } from '.';

const getSubstrateSignatureData = (payload: ActionPayload | SessionPayload) => {
  const serialized = JSON.stringify(payload);
  return new TextEncoder().encode(serialized);
};

export class SubstrateSessionController implements ISessionController {
  keyring: Keyring = new Keyring();
  signers: Record<string, { pair: IKeyringPair; privateKey: string }> = {};
  private auths: Record<
    number,
    { payload: SessionPayload; signature: string }
  > = {};

  getAddress(chainId: string) {
    return new Buffer(this.signers[chainId].pair.publicKey).toString('hex'); // TODO: use chainId to format?
  }

  async hasAuthenticatedSession(chainId: string): Promise<boolean> {
    await this.getOrCreateSigner(chainId);
    return (
      this.signers[chainId] !== undefined && this.auths[chainId] !== undefined
    );
  }

  async getOrCreateAddress(chainId: string): Promise<string> {
    return new Buffer(
      (await this.getOrCreateSigner(chainId)).publicKey
    ).toString('hex'); // TODO: use chainId to format?
  }

  async authSession(
    chainId: string,
    payload: SessionPayload,
    signature: string
  ) {
    // TODO: verify signature is valid
    // TODO: verify payload datetime is valid
    if (payload.address !== this.getAddress(chainId)) {
      throw new Error(
        `Invalid auth: ${payload.address} vs. ${this.getAddress(chainId)}`
      );
    }
    this.auths[chainId] = { payload, signature };

    const authStorageKey = `CW_SESSIONS-substrate-${chainId}-auth`;
    localStorage.setItem(authStorageKey, JSON.stringify(this.auths[chainId]));
  }

  private async getOrCreateSigner(chainId: string): Promise<IKeyringPair> {
    if (this.signers[chainId] !== undefined) {
      return this.signers[chainId].pair;
    }
    const storageKey = `CW_SESSIONS-substrate-${chainId}`;
    const authStorageKey = `CW_SESSIONS-substrate-${chainId}-auth`;
    try {
      const storage = localStorage.getItem(storageKey);
      const { privateKey } = JSON.parse(storage);
      const pair = this.keyring.addFromUri(privateKey, {}); // Use sr25519 by default?
      this.signers[chainId] = { pair, privateKey };

      // TODO: verify signature key matches this.signers[chainId]
      // TODO: verify signature is valid
      // TODO: verify payload datetime is valid
      const auth = localStorage.getItem(authStorageKey);
      if (auth !== null) {
        const {
          payload,
          signature,
        }: { payload: SessionPayload; signature: string } = JSON.parse(auth);
        if (payload.address === this.getAddress(chainId)) {
          console.log(
            'Restored authenticated session:',
            this.getAddress(chainId)
          );
          this.auths[chainId] = { payload, signature };
          // TODO: verify signature is valid, as below in sign()
          // TODO: verify payload is not expired
        } else {
          console.log('Restored logged-out session:', this.getAddress(chainId));
        }
      }
    } catch (err) {
      console.log('Could not restore previous session', err);
      const mnemonic = mnemonicGenerate();
      const pair = this.keyring.addFromMnemonic(mnemonic);
      this.signers[chainId] = { pair, privateKey: mnemonic };
      delete this.auths[chainId];
      localStorage.setItem(
        storageKey,
        JSON.stringify({ privateKey: mnemonic })
      );
    }
    return this.signers[chainId].pair;
  }

  async sign(
    chainId: string,
    call: string,
    args: Record<string, ActionArgument>
  ): Promise<{
    session: Session;
    action: Action;
    hash: string;
  }> {
    const signer = this.signers[chainId];
    const sessionPayload = this.auths[chainId]?.payload;
    const sessionSignature = this.auths[chainId]?.signature;
    // TODO: verify payload is not expired

    const actionPayload: ActionPayload = {
      from: sessionPayload.from,
      spec: sessionPayload.spec,
      timestamp: +Date.now(),
      chain: 'substrate',
      chainId,
      blockhash: sessionPayload.blockhash, // will be null
      call,
      args,
    };

    const message = getSubstrateSignatureData(actionPayload);
    const signatureBytes = signer.pair.sign(message);
    const signature = new Buffer(signatureBytes).toString('hex');
    if (
      !signatureVerify(message, signatureBytes, signer.pair.publicKey).isValid
    ) {
      throw new Error('Invalid signature!');
    }

    const session: Session = {
      type: 'session',
      payload: sessionPayload,
      signature: sessionSignature,
    };
    const action: Action = {
      type: 'action',
      payload: actionPayload,
      session: sessionPayload.from,
      signature,
    };
    const hash = Buffer.from(actionToHash(action)).toString('hex');

    return { session, action, hash };
  }
}

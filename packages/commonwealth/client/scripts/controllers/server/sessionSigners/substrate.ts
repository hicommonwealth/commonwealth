import type { Action, ActionArgument, ActionPayload, Session, SessionPayload, } from '@canvas-js/interfaces';
import { Keyring } from '@polkadot/api';
import type { IKeyringPair } from '@polkadot/types/types';
import { verify as verifyCanvasSessionSignature } from 'helpers/canvas';
import type { ISessionController } from '.';
import { addressSwapper } from '../../../../../shared/utils';

export class SubstrateSessionController implements ISessionController {
  keyring: Keyring = new Keyring({ ss58Format: 42 });
  signers: Record<string, { pair: IKeyringPair; privateKey: string }> = {};
  private auths: Record<
    number,
    { payload: SessionPayload; signature: string }
  > = {};

  getAddress(chainId: string) {
    return addressSwapper({
      address: this.signers[chainId].pair.address,
      currentPrefix: 42,
    });
  }

  async hasAuthenticatedSession(chainId: string): Promise<boolean> {
    await this.getOrCreateSigner(chainId);
    return (
      this.signers[chainId] !== undefined && this.auths[chainId] !== undefined
    );
  }

  async getOrCreateAddress(chainId: string): Promise<string> {
    return addressSwapper({
      address: (await this.getOrCreateSigner(chainId)).address,
      currentPrefix: 42,
    });
  }

  async authSession(
    chainId: string,
    payload: SessionPayload,
    signature: string
  ) {
    const valid = await verifyCanvasSessionSignature({
      session: { type: 'session', payload, signature },
    });
    if (!valid) {
      // throw new Error("Invalid signature");
    }
    if (payload.sessionAddress !== this.getAddress(chainId)) {
      throw new Error(
        `Invalid auth: ${payload.sessionAddress} vs. ${this.getAddress(
          chainId
        )}`
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
      const auth = localStorage.getItem(authStorageKey);
      if (auth !== null) {
        const {
          payload,
          signature,
        }: { payload: SessionPayload; signature: string } = JSON.parse(auth);
        const valid = await verifyCanvasSessionSignature({
          session: { type: 'session', payload, signature },
        });
        if (!valid) throw new Error();

        if (payload.sessionAddress === this.getAddress(chainId)) {
          console.log(
            'Restored authenticated session:',
            this.getAddress(chainId)
          );
          this.auths[chainId] = { payload, signature };
        } else {
          console.log('Restored logged-out session:', this.getAddress(chainId));
        }
      }
    } catch (err) {
      const polkadotUtilCrypto = await import('@polkadot/util-crypto');
      console.log('Could not restore previous session', err);
      const mnemonic = polkadotUtilCrypto.mnemonicGenerate();
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
    callArgs: Record<string, ActionArgument>
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
      app: sessionPayload.app,
      appName: 'Commonwealth',
      from: sessionPayload.from,
      timestamp: +Date.now(),
      chain: 'substrate',
      chainId,
      block: sessionPayload.block, // will be null
      call,
      callArgs,
    };

    const canvas = await import('@canvas-js/interfaces');
    const polkadotUtilCrypto = await import('@polkadot/util-crypto');
    const message = new TextEncoder().encode(
      canvas.serializeActionPayload(actionPayload)
    );

    const signatureBytes = signer.pair.sign(message);
    const signature = new Buffer(signatureBytes).toString('hex');
    if (
      !polkadotUtilCrypto.signatureVerify(
        message,
        signatureBytes,
        signer.pair.publicKey
      ).isValid
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

    const hash = canvas.getActionHash(action);

    return { session, action, hash };
  }
}

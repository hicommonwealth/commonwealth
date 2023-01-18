import { KeyPairEd25519 } from 'near-api-js/lib/utils';
import { actionToHash } from 'helpers/canvas';
import {
  Action,
  ActionPayload,
  Session,
  ActionArgument,
  SessionPayload,
} from '@canvas-js/interfaces';
import { ISessionController } from '.';

const getNearSignatureData = (payload: ActionPayload | SessionPayload) => {
  const serialized = JSON.stringify(payload);
  return new TextEncoder().encode(serialized);
};

export class NEARSessionController implements ISessionController {
  private signers: Record<string, KeyPairEd25519> = {};
  private auths: Record<
    number,
    { payload: SessionPayload; signature: string }
  > = {};

  getAddress(chainId: string): string {
    return this.signers[chainId].getPublicKey().toString();
  }

  async hasAuthenticatedSession(chainId: string): Promise<boolean> {
    await this.getOrCreateSigner(chainId);
    return (
      this.signers[chainId] !== undefined && this.auths[chainId] !== undefined
    );
  }

  async getOrCreateAddress(chainId: string): Promise<string> {
    return (await this.getOrCreateSigner(chainId)).getPublicKey().toString();
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

    const authStorageKey = `CW_SESSIONS-near-${chainId}-auth`;
    localStorage.setItem(authStorageKey, JSON.stringify(this.auths[chainId]));
  }

  private async getOrCreateSigner(chainId: string): Promise<KeyPairEd25519> {
    if (this.signers[chainId] !== undefined) {
      return this.signers[chainId];
    }
    const storageKey = `CW_SESSIONS-near-${chainId}`;
    const authStorageKey = `CW_SESSIONS-near-${chainId}-auth`;
    // TODO: test session restoration on NEAR
    try {
      const storage = localStorage.getItem(storageKey);
      const { privateKey } = JSON.parse(storage);
      this.signers[chainId] = new KeyPairEd25519(privateKey);

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
      this.signers[chainId] = KeyPairEd25519.fromRandom();
      delete this.auths[chainId];
      localStorage.setItem(
        storageKey,
        JSON.stringify({ privateKey: this.signers[chainId].secretKey })
      );
    }
    return this.signers[chainId];
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
      chain: 'near',
      chainId,
      blockhash: sessionPayload.blockhash, // will be null
      call,
      args,
    };

    const message = getNearSignatureData(actionPayload);
    const { signature: signatureBytes, publicKey } = signer.sign(message);
    const signature = new Buffer(signatureBytes).toString('hex');
    if (!signer.verify(message, signatureBytes)) {
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

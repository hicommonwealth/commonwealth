import bs58 from 'bs58';
import { KeyPairEd25519 } from 'near-api-js/lib/utils';
import { verify as verifyCanvasSessionSignature } from 'canvas';

import type {
  Action,
  ActionPayload,
  Session,
  ActionArgument,
  SessionPayload,
} from '@canvas-js/interfaces';
import { ISessionController } from '.';

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
    const valid = await verifyCanvasSessionSignature({
      session: { type: 'session', payload, signature },
    });
    if (!valid) {
      throw new Error("Invalid signature");
    }
    if (payload.sessionAddress !== this.getAddress(chainId)) {
      throw new Error(
        `Invalid auth: ${payload.sessionAddress} vs. ${this.getAddress(
          chainId
        )}`
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
      const nearApiUtils = await import('near-api-js/lib/utils');
      const storage = localStorage.getItem(storageKey);
      const { secretKey } = JSON.parse(storage);
      this.signers[chainId] = new nearApiUtils.KeyPairEd25519(secretKey);

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
      console.log('Could not restore previous session', err);
      const nearApiUtils = await import('near-api-js/lib/utils');
      this.signers[chainId] = KeyPairEd25519.fromRandom();
      delete this.auths[chainId];
      const secretKey: string = this.signers[chainId].secretKey;
      localStorage.setItem(storageKey, JSON.stringify({ secretKey }));
    }
    return this.signers[chainId];
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
      chain: 'near',
      chainId,
      block: sessionPayload.block, // will be null
      call,
      callArgs,
    };

    const canvas = await import('@canvas-js/interfaces');
    const message = new TextEncoder().encode(
      canvas.serializeActionPayload(actionPayload)
    );

    const { signature: signatureBytes } = signer.sign(message); // publicKey?
    const signature = bs58.encode(signatureBytes);
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
      session: sessionPayload.sessionAddress,
      signature,
    };

    const hash = canvas.getActionHash(action);

    return { session, action, hash };
  }
}

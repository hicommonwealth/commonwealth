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
import { ISessionController, InvalidSession } from '.';

export class NEARSessionController implements ISessionController {
  private signers: Record<string, Record<string, KeyPairEd25519>> = {};
  private auths: Record<
    number,
    Record<string, { payload: SessionPayload; signature: string }>
  > = {};

  getAddress(chainId: string, fromAddress: string): string {
    return this.signers[chainId][fromAddress].getPublicKey().toString();
  }

  async hasAuthenticatedSession(
    chainId: string,
    fromAddress: string
  ): Promise<boolean> {
    await this.getOrCreateSigner(chainId, fromAddress);
    return (
      this.signers[chainId][fromAddress] !== undefined &&
      this.auths[chainId][fromAddress] !== undefined
    );
  }

  async getOrCreateAddress(
    chainId: string,
    fromAddress: string
  ): Promise<string> {
    return (await this.getOrCreateSigner(chainId, fromAddress))
      .getPublicKey()
      .toString();
  }

  async authSession(
    chainId: string,
    fromAddress: string,
    payload: SessionPayload,
    signature: string
  ) {
    const valid = await verifyCanvasSessionSignature({
      session: { type: 'session', payload, signature },
    });
    if (!valid) {
      throw new Error('Invalid signature');
    }
    if (payload.sessionAddress !== this.getAddress(chainId, fromAddress)) {
      throw new Error(
        `Invalid auth: ${payload.sessionAddress} vs. ${this.getAddress(
          chainId,
          fromAddress
        )}`
      );
    }
    this.auths[chainId][fromAddress] = { payload, signature };

    const authStorageKey = `CW_SESSIONS-near-${chainId}-${fromAddress}-auth`;
    localStorage.setItem(
      authStorageKey,
      JSON.stringify(this.auths[chainId][fromAddress])
    );
  }

  private async getOrCreateSigner(
    chainId: string,
    fromAddress: string
  ): Promise<KeyPairEd25519> {
    this.auths[chainId] = this.auths[chainId] ?? {};
    this.signers[chainId] = this.signers[chainId] ?? {};

    if (this.signers[chainId][fromAddress] !== undefined) {
      return this.signers[chainId][fromAddress];
    }
    const storageKey = `CW_SESSIONS-near-${chainId}-${fromAddress}`;
    const authStorageKey = `CW_SESSIONS-near-${chainId}-${fromAddress}-auth`;
    // TODO: test session restoration on NEAR
    try {
      const nearApiUtils = await import('near-api-js/lib/utils');
      const storage = localStorage.getItem(storageKey);
      const { secretKey } = JSON.parse(storage);
      this.signers[chainId][fromAddress] = new nearApiUtils.KeyPairEd25519(
        secretKey
      );

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

        if (payload.sessionAddress === this.getAddress(chainId, fromAddress)) {
          console.log(
            'Restored authenticated session:',
            this.getAddress(chainId, fromAddress)
          );
          this.auths[chainId][fromAddress] = { payload, signature };
        } else {
          console.log(
            'Restored signed-out session:',
            this.getAddress(chainId, fromAddress)
          );
        }
      }
    } catch (err) {
      console.log('Could not restore previous session');
      this.signers[chainId][fromAddress] = KeyPairEd25519.fromRandom();
      delete this.auths[chainId][fromAddress];
      const secretKey: string = this.signers[chainId][fromAddress].secretKey;
      localStorage.setItem(storageKey, JSON.stringify({ secretKey }));
    }
    return this.signers[chainId][fromAddress];
  }

  async sign(
    chainId: string,
    fromAddress: string,
    call: string,
    callArgs: Record<string, ActionArgument>
  ): Promise<{
    session: Session;
    action: Action;
    hash: string;
  }> {
    this.auths[chainId] = this.auths[chainId] ?? {};
    this.signers[chainId] = this.signers[chainId] ?? {};

    const signer = this.signers[chainId][fromAddress];
    const sessionPayload = this.auths[chainId][fromAddress]?.payload;
    const sessionSignature = this.auths[chainId][fromAddress]?.signature;
    // TODO: verify payload is not expired

    if (!sessionPayload || !sessionSignature) throw new InvalidSession();

    const actionPayload: ActionPayload = {
      app: sessionPayload.app,
      from: sessionPayload.from,
      timestamp: +Date.now(),
      chain: `near:${chainId}`,
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

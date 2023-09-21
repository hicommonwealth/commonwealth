import type * as solw3 from '@solana/web3.js';
import bs58 from 'bs58';
import { verify as verifyCanvasSessionSignature } from 'canvas';

import type {
  Action,
  ActionArgument,
  ActionPayload,
  Session,
  SessionPayload,
} from '@canvas-js/interfaces';
import { ISessionController, InvalidSession } from '.';

export class SolanaSessionController implements ISessionController {
  signers: Record<string, Record<string, solw3.Keypair>> = {};
  private auths: Record<
    number,
    Record<string, { payload: SessionPayload; signature: string }>
  > = {};

  getAddress(chainId: string, fromAddress: string): string | null {
    return this.signers[chainId][fromAddress].publicKey.toBase58();
  }

  async hasAuthenticatedSession(
    chainId: string,
    fromAddress: string
  ): Promise<boolean> {
    this.getOrCreateSigner(chainId, fromAddress);
    return (
      this.signers[chainId][fromAddress] !== undefined &&
      this.auths[chainId][fromAddress] !== undefined
    );
  }

  async getOrCreateAddress(
    chainId: string,
    fromAddress: string
  ): Promise<string> {
    return (
      await this.getOrCreateSigner(chainId, fromAddress)
    ).publicKey.toBase58();
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

    const authStorageKey = `CW_SESSIONS-solana-${chainId}-${fromAddress}-auth`;
    localStorage.setItem(
      authStorageKey,
      JSON.stringify(this.auths[chainId][fromAddress])
    );
  }

  private async getOrCreateSigner(
    chainId: string,
    fromAddress: string
  ): Promise<solw3.Keypair> {
    this.auths[chainId] = this.auths[chainId] ?? {};
    this.signers[chainId] = this.signers[chainId] ?? {};

    const solw3 = await import('@solana/web3.js');
    if (this.signers[chainId][fromAddress] !== undefined) {
      return this.signers[chainId][fromAddress];
    }
    const storageKey = `CW_SESSIONS-solana-${chainId}-${fromAddress}`;
    try {
      const storage = localStorage.getItem(storageKey);
      const { privateKey }: { privateKey: string } = JSON.parse(storage);
      this.signers[chainId][fromAddress] = solw3.Keypair.fromSecretKey(
        bs58.decode(privateKey)
      );

      const authStorageKey = `CW_SESSIONS-solana-${chainId}-${fromAddress}-auth`;
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
      this.signers[chainId][fromAddress] = solw3.Keypair.generate();
      delete this.auths[chainId][fromAddress];
      const privateKey = bs58.encode(
        this.signers[chainId][fromAddress].secretKey
      );
      localStorage.setItem(storageKey, JSON.stringify({ privateKey }));
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
      timestamp: +Date.now(),
      chain: `solana:${chainId}`,
      block: sessionPayload.block, // will be null
      call,
      callArgs,
      from: sessionPayload.from,
    };

    const canvas = await import('@canvas-js/interfaces');
    const nacl = await import('tweetnacl');

    const message = new TextEncoder().encode(
      canvas.serializeActionPayload(actionPayload)
    );
    const signatureBytes = nacl.sign.detached(message, signer.secretKey);
    const signature = bs58.encode(signatureBytes);
    if (
      !nacl.sign.detached.verify(
        message,
        signatureBytes,
        signer.publicKey.toBytes()
      )
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
      session: sessionPayload.sessionAddress,
      signature,
    };

    const hash = canvas.getActionHash(action);

    return { session, action, hash };
  }
}

import type { Action, ActionArgument, ActionPayload, Session, SessionPayload, } from '@canvas-js/interfaces';
import { ethers, utils } from 'ethers';
import { verify as verifyCanvasSessionSignature } from 'helpers/canvas';
import type { ISessionController } from '.';

export class EthereumSessionController implements ISessionController {
  private signers: Record<number, ethers.Wallet> = {};
  private auths: Record<
    number,
    { payload: SessionPayload; signature: string }
  > = {};

  getAddress(chainId: string): string | null {
    return this.signers[chainId]?.address;
  }

  async hasAuthenticatedSession(chainId: string): Promise<boolean> {
    await this.getOrCreateSigner(chainId);
    return (
      this.signers[chainId] !== undefined && this.auths[chainId] !== undefined
    );
  }

  async getOrCreateAddress(chainId: string): Promise<string> {
    return (await this.getOrCreateSigner(chainId)).address;
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
    if (
      payload.sessionAddress.toLowerCase() !==
      this.signers[chainId].address.toLowerCase()
    ) {
      throw new Error(
        `Invalid auth: ${payload.sessionAddress} vs. ${this.signers[chainId].address}`
      );
    }

    this.auths[chainId] = { payload, signature };

    const authStorageKey = `CW_SESSIONS-eth-${chainId}-auth`;
    localStorage.setItem(authStorageKey, JSON.stringify(this.auths[chainId]));
  }

  private async getOrCreateSigner(chainId: string): Promise<ethers.Wallet> {
    if (this.signers[chainId] !== undefined) {
      return this.signers[chainId];
    }
    const storageKey = `CW_SESSIONS-eth-${chainId}`;
    const authStorageKey = `CW_SESSIONS-eth-${chainId}-auth`;
    try {
      // Get an unauthenticated signer from localStorage.
      const storage = localStorage.getItem(storageKey);
      const { privateKey } = JSON.parse(storage);
      this.signers[chainId] = new ethers.Wallet(privateKey);

      // Get an authentication for the signer we just deserialized.
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

        if (
          payload.sessionAddress.toLowerCase() ===
          this.signers[chainId].address.toLowerCase()
        ) {
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
      // Generate a new unauthenticated signer, and save to localStorage.
      this.signers[chainId] = ethers.Wallet.createRandom();
      delete this.auths[chainId];
      localStorage.setItem(
        storageKey,
        JSON.stringify({ privateKey: this.signers[chainId].privateKey })
      );
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
    const actionSigner = this.signers[chainId];
    const sessionPayload = this.auths[chainId]?.payload;
    const sessionSignature = this.auths[chainId]?.signature;
    // TODO: verify payload is not expired

    const actionPayload: ActionPayload = {
      app: sessionPayload.app,
      appName: 'Commonwealth',
      from: sessionPayload.from,
      timestamp: +Date.now(),
      chain: 'ethereum',
      chainId,
      block: sessionPayload.block,
      call,
      callArgs,
    };

    const canvasEthereum = await import('@canvas-js/chain-ethereum');
    const [domain, types, value] =
      canvasEthereum.getActionSignatureData(actionPayload);
    const signature = await actionSigner._signTypedData(domain, types, value);
    const recoveredAddr = utils.verifyTypedData(
      domain,
      types,
      value,
      signature
    );
    const valid = recoveredAddr === this.signers[chainId].address;
    if (!valid) throw new Error('Invalid signature!');

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

    const canvas = await import('@canvas-js/interfaces');
    const hash = canvas.getActionHash(action);

    return { session, action, hash };
  }
}

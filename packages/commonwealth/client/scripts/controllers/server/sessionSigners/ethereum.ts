import { SIWESigner } from '@canvas-js/chain-ethereum';
import type {
  Action,
  ActionArgument,
  Message,
  Session,
  SessionPayload,
  Signature,
} from '@canvas-js/interfaces';
import { CANVAS_TOPIC, verify as verifyCanvasSessionSignature } from 'canvas';
import { ethers } from 'ethers';
import { ISessionController } from '.';

export class EthereumSessionController implements ISessionController {
  private signers: Record<number, Record<string, ethers.Wallet>> = {};
  private auths: Record<
    number,
    Record<string, { payload: SessionPayload; signature: string }>
  > = {};

  getAddress(chainId: string, fromAddress: string): string | null {
    return this.signers[chainId][fromAddress]?.address;
  }

  async hasAuthenticatedSession(
    chainId: string,
    fromAddress: string,
  ): Promise<boolean> {
    await this.getOrCreateSigner(chainId, fromAddress);
    return (
      this.signers[chainId][fromAddress] !== undefined &&
      this.auths[chainId][fromAddress] !== undefined
    );
  }

  async getOrCreateAddress(
    chainId: string,
    fromAddress: string,
  ): Promise<string> {
    return (await this.getOrCreateSigner(chainId, fromAddress)).address;
  }

  async authSession(session: Session) {
    const sessionSigner = new SIWESigner();
    sessionSigner.verifySession(CANVAS_TOPIC, session);
  }

  private async getOrCreateSigner(
    chainId: string,
    fromAddress: string,
  ): Promise<ethers.Wallet> {
    this.auths[chainId] = this.auths[chainId] ?? {};
    this.signers[chainId] = this.signers[chainId] ?? {};

    if (this.signers[chainId][fromAddress] !== undefined) {
      return this.signers[chainId][fromAddress];
    }
    const storageKey = `CW_SESSIONS-eth-${chainId}-${fromAddress}`; // TODO: fromAddress
    const authStorageKey = `CW_SESSIONS-eth-${chainId}-${fromAddress}-auth`; // TODO: fromAddress
    try {
      // Get an unauthenticated signer from localStorage.
      const storage = localStorage.getItem(storageKey);
      const { privateKey } = JSON.parse(storage);
      this.signers[chainId][fromAddress] = new ethers.Wallet(privateKey);

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
          this.signers[chainId][fromAddress].address.toLowerCase()
        ) {
          console.log(
            'Restored authenticated session:',
            this.getAddress(chainId, fromAddress),
          );
          this.auths[chainId][fromAddress] = { payload, signature };
        } else {
          console.log(
            'Restored signed-out session:',
            this.getAddress(chainId, fromAddress),
          );
        }
      }
    } catch (err) {
      console.log('Could not restore previous session');
      // Generate a new unauthenticated signer, and save to localStorage.
      this.signers[chainId][fromAddress] = ethers.Wallet.createRandom();
      delete this.auths[chainId][fromAddress];
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          privateKey: this.signers[chainId][fromAddress].privateKey,
        }),
      );
    }
    return this.signers[chainId][fromAddress];
  }

  // TODO: this is completely generic
  sign(
    chainId: string,
    fromAddress: string,
    call: string,
    callArgs: Record<string, ActionArgument>,
  ): {
    message: Message<Action>;
    signature: Signature;
  } {
    const action: Action = {
      type: 'action',
      address: fromAddress,

      name: call,
      args: callArgs,

      timestamp: new Date().getTime(),
      blockhash: null,
    };
    const sessionSigner = new SIWESigner({ chainId: parseInt(chainId) });

    const message: Message<Action> = {
      clock: 0,
      parents: [],
      payload: action,
      topic: CANVAS_TOPIC,
    };

    return {
      message,
      signature: sessionSigner.sign(message),
    };
  }
}

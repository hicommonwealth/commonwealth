import { ethers } from 'ethers';
import {
  Action,
  ActionArgument,
  ActionPayload,
  Session,
  SessionPayload,
} from '@canvas-js/interfaces';
import { getActionSignatureData } from '@canvas-js/verifiers';
import { actionToHash } from 'helpers/canvas';
import { ISessionController } from '.';

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
    // TODO: verify signature is valid, as below in sign()
    // TODO: verify payload datetime is valid
    if (
      payload.address.toLowerCase() !==
      this.signers[chainId].address.toLowerCase()
    ) {
      throw new Error(
        `Invalid auth: ${payload.address} vs. ${this.signers[chainId].address}`
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
        if (
          payload.address.toLowerCase() ===
          this.signers[chainId].address.toLowerCase()
        ) {
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
    args: Record<string, ActionArgument>
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
      from: sessionPayload.from,
      spec: sessionPayload.spec,
      timestamp: +Date.now(),
      chain: 'eth',
      chainId,
      blockhash: sessionPayload.blockhash,
      call,
      args,
    };

    const [domain, types, value] = getActionSignatureData(actionPayload);
    const signature = await actionSigner._signTypedData(domain, types, value);

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

import type {
  Action,
  ActionArgument,
  ActionPayload,
  Session,
  SessionPayload,
} from '@canvas-js/interfaces';
import { getEIP712SignableAction } from 'adapters/chain/ethereum/keys';
import { verify as verifyCanvasSessionSignature } from 'canvas';
import { ethers, utils } from 'ethers';
import { ISessionController, InvalidSession } from '.';

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

  async authSession(
    chainId: string,
    fromAddress: string,
    payload: SessionPayload,
    signature: string,
  ) {
    const valid = await verifyCanvasSessionSignature({
      session: { type: 'session', payload, signature },
    });
    if (!valid) {
      throw new Error('Invalid signature');
    }
    if (
      payload.sessionAddress.toLowerCase() !==
      this.signers[chainId][fromAddress].address.toLowerCase()
    ) {
      throw new Error(
        `Invalid auth: ${payload.sessionAddress} vs. ${this.signers[chainId][fromAddress].address}`,
      );
    }

    this.auths[chainId][fromAddress] = { payload, signature };

    const authStorageKey = `CW_SESSIONS-eth-${chainId}-${fromAddress}-auth`;
    localStorage.setItem(
      authStorageKey,
      JSON.stringify(this.auths[chainId][fromAddress]),
    );
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

  async sign(
    chainId: string,
    fromAddress: string,
    call: string,
    callArgs: Record<string, ActionArgument>,
  ): Promise<{
    session: Session;
    action: Action;
    hash: string;
  }> {
    this.signers[chainId] = this.signers[chainId] ?? {};
    this.auths[chainId] = this.auths[chainId] ?? {};

    const actionSigner = this.signers[chainId][fromAddress];
    const sessionPayload = this.auths[chainId][fromAddress]?.payload;
    const sessionSignature = this.auths[chainId][fromAddress]?.signature;
    // TODO: verify payload is not expired

    if (!sessionPayload || !sessionSignature || !actionSigner)
      throw new InvalidSession();

    const actionPayload: ActionPayload = {
      app: sessionPayload.app,
      from: sessionPayload.from,
      timestamp: +Date.now(),
      chain: `eip155:${chainId}`,
      block: sessionPayload.block ?? '',
      call,
      callArgs,
    };

    // const canvasEthereum = await import('@canvas-js/chain-ethereum');
    // const [domain, types, value] =
    //   canvasEthereum.getActionSignatureData(actionPayload);
    const { domain, types, message } = getEIP712SignableAction(actionPayload);
    delete types.EIP712Domain;
    const signature = await actionSigner._signTypedData(domain, types, message);
    const recoveredAddr = utils.verifyTypedData(
      domain as any,
      types,
      message,
      signature,
    );
    const valid = recoveredAddr === this.signers[chainId][fromAddress].address;
    if (!valid) throw new Error('Invalid signature!');

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

    const canvas = await import('@canvas-js/interfaces');
    const hash = canvas.getActionHash(action);

    return { session, action, hash };
  }
}

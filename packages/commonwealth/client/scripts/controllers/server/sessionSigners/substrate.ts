import type {
  Action,
  ActionArgument,
  ActionPayload,
  Session,
  SessionPayload,
} from '@canvas-js/interfaces';
import { Keyring } from '@polkadot/api';
import { IKeyringPair } from '@polkadot/types/types';
import { verify as verifyCanvasSessionSignature } from 'canvas';
import { ISessionController, InvalidSession } from '.';
import { addressSwapper } from '../../../../../shared/utils';

export class SubstrateSessionController implements ISessionController {
  keyring: Keyring = new Keyring({ ss58Format: 42 });
  signers: Record<
    string,
    Record<string, { pair: IKeyringPair; privateKey: string }>
  > = {};
  private auths: Record<
    number,
    Record<string, { payload: SessionPayload; signature: string }>
  > = {};

  getAddress(chainId: string, fromAddress: string) {
    return addressSwapper({
      address: this.signers[chainId][fromAddress].pair.address,
      currentPrefix: 42,
    });
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
    return addressSwapper({
      address: (await this.getOrCreateSigner(chainId, fromAddress)).address,
      currentPrefix: 42,
    });
  }

  private async getOrCreateSigner(
    chainId: string,
    fromAddress: string,
  ): Promise<IKeyringPair> {
    this.auths[chainId] = this.auths[chainId] ?? {};
    this.signers[chainId] = this.signers[chainId] ?? {};

    if (this.signers[chainId][fromAddress] !== undefined) {
      return this.signers[chainId][fromAddress].pair;
    }
    const storageKey = `CW_SESSIONS-substrate-${chainId}-${fromAddress}`;
    const authStorageKey = `CW_SESSIONS-substrate-${chainId}-${fromAddress}-auth`;
    try {
      const storage = localStorage.getItem(storageKey);
      const { privateKey } = JSON.parse(storage);
      const pair = this.keyring.addFromUri(privateKey, {}); // Use sr25519 by default?
      this.signers[chainId][fromAddress] = { pair, privateKey };

      // TODO: verify signature key matches this.signers[chainId][fromAddress]
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
      const polkadotUtilCrypto = await import('@polkadot/util-crypto');
      console.log('Could not restore previous session');
      const mnemonic = polkadotUtilCrypto.mnemonicGenerate();
      const pair = this.keyring.addFromMnemonic(mnemonic);
      this.signers[chainId][fromAddress] = { pair, privateKey: mnemonic };
      delete this.auths[chainId][fromAddress];
      localStorage.setItem(
        storageKey,
        JSON.stringify({ privateKey: mnemonic }),
      );
    }
    return this.signers[chainId][fromAddress].pair;
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
      chain: `polkadot:${chainId}`,
      block: sessionPayload.block, // will be null
      call,
      callArgs,
    };

    const canvas = await import('@canvas-js/interfaces');
    const polkadotUtilCrypto = await import('@polkadot/util-crypto');
    const message = new TextEncoder().encode(
      canvas.serializeActionPayload(actionPayload),
    );

    const signatureBytes = signer.pair.sign(message);
    const signature = new Buffer(signatureBytes).toString('hex');
    if (
      !polkadotUtilCrypto.signatureVerify(
        message,
        signatureBytes,
        signer.pair.publicKey,
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
      session: sessionPayload.sessionAddress,
      signature,
    };

    const hash = canvas.getActionHash(action);

    return { session, action, hash };
  }
}

import type { Secp256k1Wallet } from '@cosmjs/amino';
import { CANVAS_TOPIC, verify as verifyCanvasSessionSignature } from 'canvas';

import { CosmosSigner } from '@canvas-js/chain-cosmos';
import type {
  Action,
  ActionArgument,
  ActionPayload,
  Session,
  SessionPayload,
} from '@canvas-js/interfaces';
import { getADR036SignableAction } from 'adapters/chain/cosmos/keys';
import { ISessionController, InvalidSession } from '.';

export class CosmosSDKSessionController implements ISessionController {
  signers: Record<
    string,
    Record<
      string,
      { signer: Secp256k1Wallet; bech32Address: string; privkey: string }
    >
  > = {};
  private auths: Record<
    number,
    Record<string, { payload: SessionPayload; signature: string }>
  > = {};

  getAddress(chainId: string, fromAddress: string): string {
    return this.signers[chainId][fromAddress]?.bech32Address;
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
    await this.getOrCreateSigner(chainId, fromAddress);
    return this.signers[chainId][fromAddress]?.bech32Address;
  }

  async authSession(session: Session) {
    const sessionSigner = new CosmosSigner();
    sessionSigner.verifySession(CANVAS_TOPIC, session);
  }

  private async getOrCreateSigner(
    chainId: string,
    fromAddress: string,
  ): Promise<{
    signer: Secp256k1Wallet;
    bech32Address: string;
    privkey: string;
  }> {
    this.auths[chainId] = this.auths[chainId] ?? {};
    this.signers[chainId] = this.signers[chainId] ?? {};

    if (this.signers[chainId][fromAddress] !== undefined) {
      return this.signers[chainId][fromAddress];
    }
    const cosm = await import('@cosmjs/amino');
    const cosmCrypto = await import('@cosmjs/crypto');

    const storageKey = `CW_SESSIONS-cosmos-${chainId}-${fromAddress}`;
    const authStorageKey = `CW_SESSIONS-cosmos-${chainId}-${fromAddress}-auth`;
    try {
      const storage = localStorage.getItem(storageKey);
      const { privkey } = JSON.parse(storage);
      const signer = await cosm.Secp256k1Wallet.fromKey(
        Buffer.from(privkey, 'hex'),
      );
      const accounts = await signer.getAccounts();
      const address = accounts[0].address;
      this.signers[chainId][fromAddress] = {
        signer,
        privkey,
        bech32Address: address,
      };

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
      console.log('Could not restore previous session');
      // Use same configuration for generating private keys as @cosmjs/amino Secp256k1HdWallet
      const entropyLength = 4 * Math.floor((11 * 24) / 33);
      const privkeyBytes = cosmCrypto.Random.getBytes(entropyLength);
      const privkey = Buffer.from(privkeyBytes).toString('hex');

      const signer = await cosm.Secp256k1Wallet.fromKey(privkeyBytes);
      const accounts = await signer.getAccounts();
      const address = accounts[0].address;
      this.signers[chainId][fromAddress] = {
        signer,
        privkey,
        bech32Address: address,
      };
      delete this.auths[chainId][fromAddress];
      localStorage.setItem(storageKey, JSON.stringify({ privkey }));
    }
    return this.signers[chainId][fromAddress];
  }

  async sign(
    chainId: string,
    fromAddress: string,
    call: string,
    callArgs: Record<string, ActionArgument>,
  ): Promise<{ session: Session; action: Action; hash: string }> {
    this.auths[chainId] = this.auths[chainId] ?? {};
    this.signers[chainId] = this.signers[chainId] ?? {};

    const {
      signer,
      privkey,
      bech32Address: address,
    } = this.signers[chainId][fromAddress];
    const sessionPayload: SessionPayload =
      this.auths[chainId][fromAddress]?.payload;
    const sessionSignature: string =
      this.auths[chainId][fromAddress]?.signature;
    // TODO: verify payload is not expired

    if (!sessionPayload || !sessionSignature) throw new InvalidSession();

    const actionPayload: ActionPayload = {
      app: sessionPayload.app,
      from: sessionPayload.from,
      timestamp: +Date.now(),
      chain: `cosmos:${chainId}`,
      block: sessionPayload.block,
      call,
      callArgs,
    };

    const cosm = await import('@cosmjs/amino');
    const cosmCrypto = await import('@cosmjs/crypto');

    // don't use signAmino, use Secp256k1.createSignature to get an ExtendedSecp256k1Signature
    const signDoc = await getADR036SignableAction(actionPayload, address);
    const signDocDigest = new cosmCrypto.Sha256(
      cosm.serializeSignDoc(signDoc),
    ).digest();
    const extendedSignature = await cosmCrypto.Secp256k1.createSignature(
      signDocDigest,
      Buffer.from(privkey, 'hex'),
    );
    const signature = Buffer.from(extendedSignature.toFixedLength()).toString(
      'hex',
    );

    const pubkey = (await signer.getAccounts())[0].pubkey;
    const valid = await cosmCrypto.Secp256k1.verifySignature(
      extendedSignature,
      signDocDigest,
      pubkey,
    );
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

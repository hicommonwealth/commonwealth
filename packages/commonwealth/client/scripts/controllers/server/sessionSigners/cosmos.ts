import { verify as verifyCanvasSessionSignature } from 'helpers/canvas';
import type {
  AminoMsg,
  StdSignDoc,
  StdFee,
  Secp256k1Wallet,
} from '@cosmjs/amino';
import type { Secp256k1 } from '@cosmjs/crypto';

import type {
  Action,
  Session,
  ActionArgument,
  ActionPayload,
  SessionPayload,
} from '@canvas-js/interfaces';
import type { ISessionController } from '.';

export const getCosmosSignatureData = async (
  actionPayload: ActionPayload,
  address: string
): Promise<StdSignDoc> => {
  const accountNumber = 0;
  const sequence = 0;
  const chainId = '';
  const fee: StdFee = {
    gas: '0',
    amount: [],
  };
  const memo = '';

  const jsonTx: AminoMsg = {
    type: 'sign/MsgSignData',
    value: {
      signer: address,
      data: JSON.stringify(actionPayload),
    },
  };
  const cosm = await import('@cosmjs/amino');
  const signDoc = cosm.makeSignDoc(
    [jsonTx],
    fee,
    chainId,
    memo,
    accountNumber,
    sequence
  );
  return signDoc;
};

export class CosmosSDKSessionController implements ISessionController {
  signers: Record<
    string,
    { signer: Secp256k1Wallet; bech32Address: string; privkey: string }
  > = {};
  private auths: Record<
    number,
    { payload: SessionPayload; signature: string }
  > = {};

  getAddress(chainId: string): string {
    return this.signers[chainId]?.bech32Address;
  }

  async hasAuthenticatedSession(chainId: string): Promise<boolean> {
    await this.getOrCreateSigner(chainId);
    return (
      this.signers[chainId] !== undefined && this.auths[chainId] !== undefined
    );
  }

  async getOrCreateAddress(chainId: string): Promise<string> {
    await this.getOrCreateSigner(chainId);
    return this.signers[chainId]?.bech32Address;
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
    if (payload.sessionAddress !== this.getAddress(chainId)) {
      throw new Error(
        `Invalid auth: ${payload.sessionAddress} vs. ${this.getAddress(
          chainId
        )}`
      );
    }
    this.auths[chainId] = { payload, signature };

    const authStorageKey = `CW_SESSIONS-cosmos-${chainId}-auth`;
    localStorage.setItem(authStorageKey, JSON.stringify(this.auths[chainId]));
  }

  private async getOrCreateSigner(chainId: string): Promise<{
    signer: Secp256k1Wallet;
    bech32Address: string;
    privkey: string;
  }> {
    if (this.signers[chainId] !== undefined) {
      return this.signers[chainId];
    }
    const cosm = await import('@cosmjs/amino');
    const cosmCrypto = await import('@cosmjs/crypto');

    const storageKey = `CW_SESSIONS-cosmos-${chainId}`;
    const authStorageKey = `CW_SESSIONS-cosmos-${chainId}-auth`;
    try {
      const storage = localStorage.getItem(storageKey);
      const { privkey } = JSON.parse(storage);
      const signer = await cosm.Secp256k1Wallet.fromKey(
        Buffer.from(privkey, 'hex')
      );
      const accounts = await signer.getAccounts();
      const address = accounts[0].address;
      this.signers[chainId] = { signer, privkey, bech32Address: address };

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
      // Use same configuration for generating private keys as @cosmjs/amino Secp256k1HdWallet
      const entropyLength = 4 * Math.floor((11 * 24) / 33);
      const privkeyBytes = cosmCrypto.Random.getBytes(entropyLength);
      const privkey = Buffer.from(privkeyBytes).toString('hex');

      const signer = await cosm.Secp256k1Wallet.fromKey(privkeyBytes);
      const accounts = await signer.getAccounts();
      const address = accounts[0].address;
      this.signers[chainId] = { signer, privkey, bech32Address: address };
      delete this.auths[chainId];
      localStorage.setItem(storageKey, JSON.stringify({ privkey }));
    }
    return this.signers[chainId];
  }

  async sign(
    chainId: string,
    call: string,
    callArgs: Record<string, ActionArgument>
  ): Promise<{ session: Session; action: Action; hash: string }> {
    const { signer, privkey, bech32Address: address } = this.signers[chainId];
    const sessionPayload: SessionPayload = this.auths[chainId]?.payload;
    const sessionSignature: string = this.auths[chainId]?.signature;
    // TODO: verify payload is not expired

    const actionPayload: ActionPayload = {
      app: sessionPayload.app,
      appName: 'Commonwealth',
      from: sessionPayload.from,
      timestamp: +Date.now(),
      chain: 'cosmos',
      chainId,
      block: sessionPayload.block,
      call,
      callArgs,
    };

    const cosm = await import('@cosmjs/amino');
    const cosmCrypto = await import('@cosmjs/crypto');

    // don't use signAmino, use Secp256k1.createSignature to get an ExtendedSecp256k1Signature
    const signDoc = await getCosmosSignatureData(actionPayload, address);
    const signDocDigest = new cosmCrypto.Sha256(
      cosm.serializeSignDoc(signDoc)
    ).digest();
    const extendedSignature = await cosmCrypto.Secp256k1.createSignature(
      signDocDigest,
      Buffer.from(privkey, 'hex')
    );
    const signature = Buffer.from(extendedSignature.toFixedLength()).toString(
      'hex'
    );

    const pubkey = (await signer.getAccounts())[0].pubkey;
    const valid = await cosmCrypto.Secp256k1.verifySignature(
      extendedSignature,
      signDocDigest,
      pubkey
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
      session: sessionPayload.from,
      signature,
    };

    const canvas = await import('@canvas-js/interfaces');
    const hash = canvas.getActionHash(action);

    return { session, action, hash };
  }
}

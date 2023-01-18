import { actionToHash } from 'helpers/canvas';
import { Secp256k1Wallet, serializeSignDoc } from '@cosmjs/amino';
import { decodeSignature } from '@cosmjs/launchpad';
import {
  Random,
  Sha256,
  Secp256k1,
  Secp256k1Signature,
  ExtendedSecp256k1Signature,
} from '@cosmjs/crypto';

import {
  Action,
  Session,
  ActionArgument,
  ActionPayload,
  SessionPayload,
} from '@canvas-js/interfaces';
import { ISessionController } from '.';

// For canvasActionToSignDoc:
import { AminoMsg, makeSignDoc, StdSignDoc, StdFee } from '@cosmjs/amino';

const getCosmosSignatureData = (
  actionPayload: ActionPayload,
  address: string
): StdSignDoc => {
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
  const signDoc = makeSignDoc(
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
  signers: Record<string, { signer: Secp256k1Wallet; bech32Address: string }> =
    {};
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
    // TODO: verify signature is valid
    // TODO: verify payload datetime is valid
    if (payload.address !== this.getAddress(chainId)) {
      throw new Error(
        `Invalid auth: ${payload.address} vs. ${this.getAddress(chainId)}`
      );
    }
    this.auths[chainId] = { payload, signature };

    const authStorageKey = `CW_SESSIONS-cosmos-${chainId}-auth`;
    localStorage.setItem(authStorageKey, JSON.stringify(this.auths[chainId]));
  }

  private async getOrCreateSigner(chainId: string): Promise<Secp256k1Wallet> {
    if (this.signers[chainId] !== undefined) {
      return this.signers[chainId]?.signer;
    }
    const storageKey = `CW_SESSIONS-cosmos-${chainId}`;
    const authStorageKey = `CW_SESSIONS-cosmos-${chainId}-auth`;
    try {
      const storage = localStorage.getItem(storageKey);
      const { privateKey: privateKeyBytes } = JSON.parse(storage);
      const privateKey = Buffer.from(privateKeyBytes, 'hex');
      const signer = await Secp256k1Wallet.fromKey(privateKey);
      const accounts = await signer.getAccounts();
      const address = accounts[0].address;
      this.signers[chainId] = { signer, bech32Address: address };

      const auth = localStorage.getItem(authStorageKey);
      if (auth !== null) {
        const {
          payload,
          signature,
        }: { payload: SessionPayload; signature: string } = JSON.parse(auth);

        if (payload.address === this.getAddress(chainId)) {
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
      // Use same configuration for generating private keys as @cosmjs/amino Secp256k1HdWallet
      const entropyLength = 4 * Math.floor((11 * 24) / 33);
      const privateKeyBytes = Random.getBytes(entropyLength);
      const privateKey = Buffer.from(privateKeyBytes).toString('hex');

      const signer = await Secp256k1Wallet.fromKey(privateKeyBytes);
      const accounts = await signer.getAccounts();
      const address = accounts[0].address;
      this.signers[chainId] = { signer, bech32Address: address };
      delete this.auths[chainId];
      localStorage.setItem(storageKey, JSON.stringify({ privateKey, address }));
    }
    return this.signers[chainId].signer;
  }

  async sign(
    chainId: string,
    call: string,
    args: Record<string, ActionArgument>
  ): Promise<{ session: Session; action: Action; hash: string }> {
    const { signer, bech32Address: address } = this.signers[chainId];
    const sessionPayload: SessionPayload = this.auths[chainId]?.payload;
    const sessionSignature: string = this.auths[chainId]?.signature;
    // TODO: verify payload is not expired

    const actionPayload: ActionPayload = {
      from: sessionPayload.from,
      spec: sessionPayload.spec,
      timestamp: +Date.now(),
      chain: 'cosmos',
      chainId,
      blockhash: sessionPayload.blockhash,
      call,
      args,
    };

    const signDoc = getCosmosSignatureData(actionPayload, address);
    const signatureBase64 = (
      await signer.signAmino(sessionPayload.address, signDoc)
    ).signature;
    const { pubkey, signature: signatureBytes } =
      decodeSignature(signatureBase64);
    const signature = '0x' + Buffer.from(signatureBytes).toString('hex');

    // Verification is more complicated for Cosmos because of the layers of signature wrapping
    const signDocDigest = new Sha256(serializeSignDoc(signDoc)).digest();
    const secp256k1Signature =
      Secp256k1Signature.fromFixedLength(signatureBytes);
    const valid = await Secp256k1.verifySignature(
      secp256k1Signature,
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

    const hash = Buffer.from(actionToHash(action)).toString('hex');

    return { session, action, hash };
  }
}

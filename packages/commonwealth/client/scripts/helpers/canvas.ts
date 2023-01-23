import createHash from 'create-hash';
import {
  Action,
  Session,
  serializeActionPayload,
  serializeSessionPayload,
} from '@canvas-js/interfaces';
import { getActionSignatureData } from '@canvas-js/verifiers';

import { getCosmosSignatureData } from 'controllers/server/sessionSigners/cosmos';
import { constructTypedCanvasMessage } from '../../../shared/adapters/chain/ethereum/keys';
import { validationTokenToSignDoc } from '../../../shared/adapters/chain/cosmos/keys';

import { utils as ethersUtils } from 'ethers';
import * as ethUtil from 'ethereumjs-util';
import * as bech32 from 'bech32';
import {
  recoverTypedSignature,
  SignTypedDataVersion,
} from '@metamask/eth-sig-util';
import {
  serializeSignDoc,
  rawSecp256k1PubkeyToRawAddress,
  decodeSignature,
} from '@cosmjs/amino';
import { Bech32 } from '@cosmjs/encoding';
import {
  Sha256,
  Secp256k1,
  Secp256k1Signature,
  ExtendedSecp256k1Signature,
} from '@cosmjs/crypto';
import { PublicKey } from 'near-api-js/lib/utils';
import { signatureVerify } from '@polkadot/util-crypto';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

export function actionToHash(action: Action): Buffer {
  const payload = serializeActionPayload(action.payload);
  return createHash('sha256').update({ ...action, payload }).digest();
}

export function sessionToHash(session: Session): Buffer {
  const payload = serializeSessionPayload(session.payload);
  return createHash('sha256').update({ ...session, payload }).digest();
}

// TODO: verify payload is not expired
export const verify = async ({
  action,
  session,
  actionSignerAddress,
}: {
  action?: Action;
  session?: Session;
  actionSignerAddress?: string;
}): Promise<boolean> => {
  // Do some logic so the verification function supports both sessions and actions.
  if (action === undefined && session === undefined) return false;
  if (action !== undefined && session !== undefined) return false;
  if (action !== undefined && actionSignerAddress === undefined) return false;

  const actionPayload = action?.payload;
  const sessionPayload = session?.payload;
  const signature = action?.signature ?? session?.signature;
  const payload = action?.payload ?? session?.payload;
  if (!payload || !signature) return false;

  if (payload.chain === 'eth') {
    // verify ethereum signature
    if (action) {
      const [domain, types, value] = getActionSignatureData(actionPayload);
      const recoveredAddr = ethersUtils.verifyTypedData(
        domain,
        types,
        value,
        signature
      );
      return recoveredAddr.toLowerCase() === actionSignerAddress.toLowerCase();
    } else {
      const { types, domain, message } =
        constructTypedCanvasMessage(sessionPayload);
      const recoveredAddr = recoverTypedSignature({
        data: { types, domain, message, primaryType: 'Message' },
        signature,
        version: SignTypedDataVersion.V4,
      });
      return recoveredAddr.toLowerCase() === session.payload.from.toLowerCase();
    }
  } else if (payload.chain === 'cosmos') {
    // verify terra sessions (actions are verified like other cosmos chains)
    if (
      !action &&
      bech32.bech32.decode(sessionPayload.from).prefix === 'terra'
    ) {
      const prefix = Bech32.decode(sessionPayload.from).prefix;
      const signDocDigest = new Sha256(
        Buffer.from(serializeSessionPayload(sessionPayload))
      ).digest();
      // decode "{ pub_key, signature }" to an object with { pubkey, signature }
      const { pubkey, signature: decodedSignature } = decodeSignature(
        JSON.parse(signature)
      );
      const secpSignature =
        Secp256k1Signature.fromFixedLength(decodedSignature);
      const valid = await Secp256k1.verifySignature(
        secpSignature,
        signDocDigest,
        pubkey
      );
      if (
        payload.from !==
        Bech32.encode(prefix, rawSecp256k1PubkeyToRawAddress(pubkey))
      )
        return false;
      return valid;
    }
    // verify cosmos-ethereum sessions (actions are verified like other cosmos chains)
    if (!action && signature.startsWith('0x')) {
      const msgHash = ethUtil.hashPersonalMessage(Buffer.from(serializeSessionPayload(sessionPayload)));
      const ethSignatureParams = ethUtil.fromRpcSig(signature.trim());
      // recover the eth signature, then convert to cosmos address
      const publicKey = ethUtil.ecrecover(
        msgHash,
        ethSignatureParams.v,
        ethSignatureParams.r,
        ethSignatureParams.s
      );
      const lowercaseAddress = ethUtil.bufferToHex(
        ethUtil.publicToAddress(publicKey)
      );
      const bech32AddrBuf = ethUtil.Address.fromString(
        lowercaseAddress.toString()
      ).toBuffer();
      const { prefix } = bech32.bech32.decode(payload.from);
      const bech32Address = bech32.bech32.encode(
        prefix,
        bech32.bech32.toWords(bech32AddrBuf)
      );
      const valid = payload.from === bech32Address;
      return valid;
    }
    // verify cosmos signature (base64)
    if (action) {
      const signDocPayload = getCosmosSignatureData(
        actionPayload,
        actionSignerAddress
      );
      const signDocDigest = new Sha256(
        serializeSignDoc(signDocPayload)
      ).digest();
      const prefix = 'cosmos'; // not: Bech32.decode(payload.from).prefix;
      const extendedSecp256k1Signature =
        ExtendedSecp256k1Signature.fromFixedLength(
          Buffer.from(signature, 'hex')
        );
      const pubkey = Secp256k1.compressPubkey(
        Secp256k1.recoverPubkey(extendedSecp256k1Signature, signDocDigest)
      );
      return (
        actionSignerAddress ===
        Bech32.encode(prefix, rawSecp256k1PubkeyToRawAddress(pubkey))
      );
    } else {
      const signDocPayload = validationTokenToSignDoc(
        Buffer.from(serializeSessionPayload(sessionPayload)),
        payload.from
      );
      const signDocDigest = new Sha256(
        serializeSignDoc(signDocPayload)
      ).digest();
      const prefix = Bech32.decode(payload.from).prefix;
      // decode "{ pub_key, signature }" to an object with { pubkey, signature }
      const { pubkey, signature: decodedSignature } = decodeSignature(
        JSON.parse(signature)
      );
      if (
        payload.from !==
        Bech32.encode(prefix, rawSecp256k1PubkeyToRawAddress(pubkey))
      )
        return false;
      const secpSignature =
        Secp256k1Signature.fromFixedLength(decodedSignature);
      const valid = await Secp256k1.verifySignature(
        secpSignature,
        signDocDigest,
        pubkey
      );
      return valid;
    }
  } else if (payload.chain === 'solana') {
    // verify solana signature
    const stringPayload = action
      ? serializeActionPayload(actionPayload)
      : serializeSessionPayload(sessionPayload);
    const message = new TextEncoder().encode(stringPayload);
    const signatureBytes = bs58.decode(signature);
    const signerPublicKeyBytes = bs58.decode(
      action ? actionSignerAddress : payload.from
    );
    const valid = nacl.sign.detached.verify(
      message,
      signatureBytes,
      signerPublicKeyBytes
    );
    return valid;
  } else if (payload.chain === 'near') {
    // verify near signature
    if (action) {
      const stringPayload = serializeActionPayload(actionPayload);
      const message = new TextEncoder().encode(stringPayload);
      const publicKey = PublicKey.fromString(actionSignerAddress);
      const signatureBytes = bs58.decode(signature); // encoded in sessionSigners/near.ts
      const valid = nacl.sign.detached.verify(
        message,
        signatureBytes,
        publicKey.data
      );
      return valid;
    } else if (session) {
      // TODO: confirm `JSON.parse(signature).publicKey === payload.from`.
      // NEAR doesn't provide a way for .near address to be mapped to public keys, so
      // we should either store more data on NEAR logins, or push session creation to
      // the NEAR wallet altogether.
      const stringPayload = serializeSessionPayload(sessionPayload);
      const message = new TextEncoder().encode(stringPayload);
      const { signature: signatureEncoded, publicKey: publicKeyEncoded } =
        JSON.parse(signature);
      // encoded in client/scripts/controllers/chain/near/account.ts
      const publicKey = PublicKey.fromString(
        bs58.encode(Buffer.from(publicKeyEncoded, 'base64'))
      );
      const signatureBytes = Buffer.from(signatureEncoded, 'base64');
      const valid = nacl.sign.detached.verify(
        message,
        signatureBytes,
        publicKey.data
      );
      return valid;
    }
  } else if (payload.chain === 'substrate') {
    // verify substrate signature
    const stringPayload = action
      ? serializeActionPayload(actionPayload)
      : serializeSessionPayload(sessionPayload);
    const message = new TextEncoder().encode(stringPayload);
    const signatureBytes = new Buffer(
      action ? signature : signature.slice(2),
      'hex'
    );
    const valid = signatureVerify(
      message,
      signatureBytes,
      action ? actionSignerAddress : payload.from
    ).isValid;
    return valid;
  } else {
    return false;
  }
};

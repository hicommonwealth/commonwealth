/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Action, Session } from '@canvas-js/interfaces';

import { ChainBase } from '@hicommonwealth/core';
import {
  getADR036SignableAction,
  getADR036SignableSession,
} from '../adapters/chain/cosmos/keys';
import {
  createSiweMessage,
  getEIP712SignableAction,
} from '../adapters/chain/ethereum/keys';
import { caip2ToChainBase } from './chainMappings';

import { configure } from 'safe-stable-stringify';
import { MAGIC_API_KEY } from 'server/config';
export const stringify = configure({
  bigint: false,
  circularValue: Error,
  strict: true,
  deterministic: true,
});

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

  const chainBase = caip2ToChainBase(payload.chain);

  if (chainBase === ChainBase.Ethereum) {
    // verify ethereum signature
    if (action) {
      const ethersUtils = (await import('ethers')).utils;
      const { domain, types, message } = getEIP712SignableAction(actionPayload);
      delete types.EIP712Domain;
      const recoveredAddr = ethersUtils.verifyTypedData(
        domain as any, // domain.salt has incompatible type
        types,
        message,
        signature,
      );
      return recoveredAddr.toLowerCase() === actionSignerAddress.toLowerCase();
    } else {
      const signaturePattern = /^(.+)\/([A-Za-z0-9]+)\/(0x[A-Fa-f0-9]+)$/;
      const signaturePatternMatch = signaturePattern.exec(signature);
      if (signaturePatternMatch === null) {
        throw new Error(
          `Invalid signature: signature did not match ${signaturePattern}`,
        );
      }
      const [_, domain, nonce, signatureData] = signaturePatternMatch;

      const siweMessage = createSiweMessage(sessionPayload, domain, nonce);

      const ethersUtils = (await import('ethers')).utils;
      const recoveredAddr = ethersUtils.verifyMessage(
        siweMessage,
        signatureData,
      );

      return recoveredAddr.toLowerCase() === session.payload.from.toLowerCase();
    }
  } else if (chainBase === ChainBase.CosmosSDK) {
    // verify terra sessions (actions are verified like other cosmos chains)
    const [bech32, cosmAmino, cosmEncoding, cosmCrypto] = await Promise.all([
      import('bech32'),
      import('@cosmjs/amino'),
      import('@cosmjs/encoding'),
      import('@cosmjs/crypto'),
    ]);

    if (sessionPayload.from.startsWith('magic:')) {
      // validate magic DID token
      const magicSDK = await import('@magic-sdk/admin');
      const magic = new magicSDK.Magic(MAGIC_API_KEY);

      const signaturePattern = /(.+)\/([A-Za-z0-9+]+)\/([A-Za-z0-9+=]+)/;
      const signaturePatternMatch = signaturePattern.exec(signature);
      if (signaturePatternMatch === null) {
        throw new Error(
          `Invalid signature: signature did not match ${signaturePattern}`,
        );
      }
      const [_, domain, nonce, signatureData] = signaturePatternMatch;

      await magic.token.validate(
        signatureData,
        sessionPayload.from.replace('magic:', ''),
      );
      // if no error thrown, signature is valid
      return true;
    } else if (
      !action &&
      bech32.bech32.decode(sessionPayload.from).prefix === 'terra'
    ) {
      const prefix = cosmEncoding.fromBech32(sessionPayload.from).prefix;
      const signDocDigest = new cosmCrypto.Sha256(
        Buffer.from(stringify(sessionPayload)),
      ).digest();
      // decode "{ pub_key, signature }" to an object with { pubkey, signature }
      const { pubkey, signature: decodedSignature } = cosmAmino.decodeSignature(
        JSON.parse(signature),
      );
      const secpSignature =
        cosmCrypto.Secp256k1Signature.fromFixedLength(decodedSignature);
      const valid = await cosmCrypto.Secp256k1.verifySignature(
        secpSignature,
        signDocDigest,
        pubkey,
      );
      if (
        payload.from !==
        cosmEncoding.toBech32(
          prefix,
          cosmAmino.rawSecp256k1PubkeyToRawAddress(pubkey),
        )
      )
        return false;
      return valid;
    }
    // verify cosmos-ethereum sessions (actions are verified like other cosmos chains)
    if (!action && signature.startsWith('0x')) {
      const ethUtil = await import('ethereumjs-util');
      const msgHash = ethUtil.hashPersonalMessage(
        Buffer.from(stringify(sessionPayload)),
      );
      const ethSignatureParams = ethUtil.fromRpcSig(signature.trim());
      // recover the eth signature, then convert to cosmos address
      const publicKey = ethUtil.ecrecover(
        msgHash,
        ethSignatureParams.v,
        ethSignatureParams.r,
        ethSignatureParams.s,
      );
      const lowercaseAddress = ethUtil.bufferToHex(
        ethUtil.publicToAddress(publicKey),
      );
      const bech32AddrBuf = ethUtil.Address.fromString(
        lowercaseAddress.toString(),
      ).toBuffer();
      const { prefix } = bech32.bech32.decode(payload.from);
      const bech32Address = bech32.bech32.encode(
        prefix,
        bech32.bech32.toWords(bech32AddrBuf),
      );
      const valid = payload.from === bech32Address;
      return valid;
    }
    // verify cosmos actions (base64)
    if (action) {
      const signDocPayload = await getADR036SignableAction(
        actionPayload,
        actionSignerAddress,
      );
      const signDocDigest = new cosmCrypto.Sha256(
        cosmAmino.serializeSignDoc(signDocPayload),
      ).digest();
      const prefix = 'cosmos'; // not: Bech32.decode(payload.from).prefix;
      const extendedSecp256k1Signature =
        cosmCrypto.ExtendedSecp256k1Signature.fromFixedLength(
          Buffer.from(signature, 'hex'),
        );
      const pubkey = cosmCrypto.Secp256k1.compressPubkey(
        cosmCrypto.Secp256k1.recoverPubkey(
          extendedSecp256k1Signature,
          signDocDigest,
        ),
      );
      return (
        actionSignerAddress ===
        cosmEncoding.toBech32(
          prefix,
          cosmAmino.rawSecp256k1PubkeyToRawAddress(pubkey),
        )
      );
    } else {
      // verify cosmos sessions
      // - launchpad sessions (legacy) have signature of format { pubkey, signature, chain_id }
      //   and chain_id needs to be stripped and attached to signDoc instead
      // - stargate sessions (ADR-036) have signature of format { pubkey, signature }
      const {
        pub_key,
        signature: predecodedSignature,
        chain_id,
      } = JSON.parse(signature);
      const signDoc = await getADR036SignableSession(
        Buffer.from(stringify(sessionPayload)),
        payload.from,
        chain_id, // if undefined, signDoc produces an ADR-036 signature
      );
      const signDocDigest = new cosmCrypto.Sha256(
        cosmAmino.serializeSignDoc(signDoc),
      ).digest();
      const prefix = cosmEncoding.fromBech32(payload.from).prefix;
      // decode "{ pub_key, signature }" to an object with { pubkey, signature }
      const { pubkey, signature: decodedSignature } = cosmAmino.decodeSignature(
        { pub_key, signature: predecodedSignature },
      );
      if (
        payload.from !==
        cosmEncoding.toBech32(
          prefix,
          cosmAmino.rawSecp256k1PubkeyToRawAddress(pubkey),
        )
      ) {
        return false;
      }
      const secpSignature =
        cosmCrypto.Secp256k1Signature.fromFixedLength(decodedSignature);
      const valid = await cosmCrypto.Secp256k1.verifySignature(
        secpSignature,
        signDocDigest,
        pubkey,
      );
      return valid;
    }
  } else if (chainBase === ChainBase.Solana) {
    const nacl = await import('tweetnacl');
    const bs58 = await import('bs58');
    // verify solana signature (action, session)
    const stringPayload = action
      ? stringify(actionPayload)
      : stringify(sessionPayload);
    const message = new TextEncoder().encode(stringPayload);
    const signatureBytes = bs58.decode(signature);
    const signerPublicKeyBytes = bs58.decode(
      action ? actionSignerAddress : payload.from,
    );
    const valid = nacl.sign.detached.verify(
      message,
      signatureBytes,
      signerPublicKeyBytes,
    );
    return valid;
  } else if (chainBase === ChainBase.NEAR) {
    const nearlib = await import('near-api-js/lib/utils');
    const nacl = await import('tweetnacl');
    const bs58 = await import('bs58');
    // verify near signature (action, session)
    if (action) {
      const stringPayload = stringify(actionPayload);
      const message = new TextEncoder().encode(stringPayload);
      const publicKey = nearlib.PublicKey.fromString(actionSignerAddress);
      const signatureBytes = bs58.decode(signature); // encoded in sessionSigners/near.ts
      const valid = nacl.sign.detached.verify(
        message,
        signatureBytes,
        publicKey.data,
      );
      return valid;
    } else if (session) {
      // TODO: confirm `JSON.parse(signature).publicKey === payload.from`.
      // NEAR doesn't provide a way for .near address to be mapped to public keys, so
      // we should either store more data on NEAR logins, or push session creation to
      // the NEAR wallet altogether.
      const stringPayload = stringify(sessionPayload);
      const message = new TextEncoder().encode(stringPayload);
      const { signature: signatureEncoded, publicKey: publicKeyEncoded } =
        JSON.parse(signature);
      // encoded in client/scripts/controllers/chain/near/account.ts
      const publicKey = nearlib.PublicKey.fromString(
        bs58.encode(Buffer.from(publicKeyEncoded, 'base64')),
      );
      const signatureBytes = Buffer.from(signatureEncoded, 'base64');
      const valid = nacl.sign.detached.verify(
        message,
        signatureBytes,
        publicKey.data,
      );
      return valid;
    }
  } else if (chainBase === ChainBase.Substrate) {
    // verify substrate signature (action, session)
    const polkadotUtil = await import('@polkadot/util-crypto');
    const stringPayload = action
      ? stringify(actionPayload)
      : stringify(sessionPayload);
    const message = new TextEncoder().encode(stringPayload);
    const signatureBytes = new Buffer(
      action ? signature : signature.slice(2),
      'hex',
    );
    const valid = polkadotUtil.signatureVerify(
      message,
      signatureBytes,
      action ? actionSignerAddress : payload.from,
    ).isValid;
    return valid;
  } else {
    return false;
  }
};

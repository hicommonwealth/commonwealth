import type { KeyringOptions } from '@polkadot/keyring/types';
import { hexToU8a, stringToHex } from '@polkadot/util';
import type { KeypairType } from '@polkadot/util-crypto/types';
import { bech32 } from 'bech32';
import bs58 from 'bs58';
import { verifyMessage } from 'ethers/lib/utils';

import {
  ChainBase,
  NotificationCategories,
  WalletId,
  logger,
} from '@hicommonwealth/core';
import * as ethUtil from 'ethereumjs-util';
import { configure as configureStableStringify } from 'safe-stable-stringify';
import Sequelize from 'sequelize';

import { getADR036SignableSession } from '../../shared/adapters/chain/cosmos/keys';
import { createSiweMessage } from '../../shared/adapters/chain/ethereum/keys';
import {
  chainBaseToCanvasChainId,
  createCanvasSessionPayload,
} from '../../shared/canvas';
import { addressSwapper } from '../../shared/utils';
import type { DB } from '../models';
import type { AddressInstance } from '../models/address';
import type { CommunityInstance } from '../models/community';
import type { ProfileAttributes } from '../models/profile';

const log = logger().getLogger(__filename);

const sortedStringify = configureStableStringify({
  bigint: false,
  circularValue: Error,
  strict: true,
  deterministic: true,
});

const verifySessionSignature = async (
  models: DB,
  chain: Readonly<CommunityInstance>,
  chain_id: string | number,
  addressModel: AddressInstance,
  user_id: number,
  signatureString: string,
  sessionAddress: string | null, // used when signing a block to login
  sessionIssued: string | null, // used when signing a block to login
  sessionBlockInfo: string | null, // used when signing a block to login
): Promise<boolean> => {
  if (!chain) {
    log.error('no chain provided to verifySignature');
    return false;
  }

  // Reconstruct the expected canvas message.
  const canvasChainId = chainBaseToCanvasChainId(chain.base, chain_id);

  const canvasSessionPayload = createCanvasSessionPayload(
    chain.base,
    canvasChainId,
    chain.base === ChainBase.Substrate
      ? addressSwapper({
          address: addressModel.address,
          currentPrefix: 42,
        })
      : addressModel.address,
    sessionAddress,
    parseInt(sessionIssued, 10),
    sessionBlockInfo
      ? addressModel.block_info
        ? JSON.parse(addressModel.block_info).hash
        : null
      : null,
  );

  let isValid: boolean;
  if (chain.base === ChainBase.Substrate) {
    //
    // substrate address handling
    //
    const polkadot = await import('@polkadot/keyring');
    const address = polkadot.decodeAddress(addressModel.address);
    const keyringOptions: KeyringOptions = { type: 'sr25519' };
    if (
      !addressModel.keytype ||
      addressModel.keytype === 'sr25519' ||
      addressModel.keytype === 'ed25519'
    ) {
      if (addressModel.keytype) {
        keyringOptions.type = addressModel.keytype as KeypairType;
      }
      keyringOptions.ss58Format = chain.ss58_prefix ?? 42;
      const signerKeyring = new polkadot.Keyring(keyringOptions).addFromAddress(
        address,
      );
      const message = stringToHex(sortedStringify(canvasSessionPayload));

      const signatureU8a =
        signatureString.slice(0, 2) === '0x'
          ? hexToU8a(signatureString)
          : hexToU8a(`0x${signatureString}`);
      isValid = signerKeyring.verify(message, signatureU8a, address);
    } else {
      log.error('Invalid keytype.');
      isValid = false;
    }
  } else if (
    chain.base === ChainBase.CosmosSDK &&
    (addressModel.wallet_id === WalletId.CosmosEvmMetamask ||
      addressModel.wallet_id === WalletId.KeplrEthereum)
  ) {
    //
    // ethereum address handling on cosmos chains via metamask
    //
    const msgBuffer = Buffer.from(sortedStringify(canvasSessionPayload));

    // toBuffer() doesn't work if there is a newline
    const msgHash = ethUtil.hashPersonalMessage(msgBuffer);
    const ethSignatureParams = ethUtil.fromRpcSig(signatureString.trim());
    const publicKey = ethUtil.ecrecover(
      msgHash,
      ethSignatureParams.v,
      ethSignatureParams.r,
      ethSignatureParams.s,
    );

    const addressBuffer = ethUtil.publicToAddress(publicKey);
    const lowercaseAddress = ethUtil.bufferToHex(addressBuffer);
    try {
      // const ethAddress = Web3.utils.toChecksumAddress(lowercaseAddress);
      const b32AddrBuf = ethUtil.Address.fromString(
        lowercaseAddress.toString(),
      ).toBuffer();
      const b32Address = bech32.encode(
        chain.bech32_prefix,
        bech32.toWords(b32AddrBuf),
      );
      if (addressModel.address === b32Address) isValid = true;
    } catch (e) {
      isValid = false;
    }
  } else if (
    chain.base === ChainBase.CosmosSDK &&
    chain.bech32_prefix === 'terra'
  ) {
    //
    // cosmos-sdk address handling
    //

    // provided string should be serialized AminoSignResponse object
    const stdSignature = JSON.parse(signatureString);

    // we generate an address from the actual public key and verify that it matches,
    // this prevents people from using a different key to sign the message than
    // the account they registered with.
    // TODO: ensure ion works
    const bech32Prefix = chain.bech32_prefix;

    const cosmCrypto = await import('@cosmjs/crypto');
    if (!bech32Prefix) {
      log.error('No bech32 prefix found.');
      isValid = false;
    } else {
      const cosm = await import('@cosmjs/amino');
      const generatedAddress = cosm.pubkeyToAddress(
        stdSignature.pub_key,
        bech32Prefix,
      );

      if (generatedAddress === addressModel.address) {
        try {
          // directly verify the generated signature, generated via SignBytes
          const { pubkey, signature } = cosm.decodeSignature(stdSignature);
          const secpSignature =
            cosmCrypto.Secp256k1Signature.fromFixedLength(signature);
          const messageHash = new cosmCrypto.Sha256(
            Buffer.from(sortedStringify(canvasSessionPayload)),
          ).digest();

          isValid = await cosmCrypto.Secp256k1.verifySignature(
            secpSignature,
            messageHash,
            pubkey,
          );
        } catch (e) {
          isValid = false;
        }
      }
    }
  } else if (chain.base === ChainBase.CosmosSDK) {
    //
    // cosmos-sdk address handling
    //
    const stdSignature = JSON.parse(signatureString);

    const bech32Prefix = chain.bech32_prefix;
    if (!bech32Prefix) {
      log.error('No bech32 prefix found.');
      isValid = false;
    } else {
      const cosm = await import('@cosmjs/amino');
      const generatedAddress = cosm.pubkeyToAddress(
        stdSignature.pub_key,
        bech32Prefix,
      );
      const generatedAddressWithCosmosPrefix = cosm.pubkeyToAddress(
        stdSignature.pub_key,
        'cosmos',
      );

      if (
        generatedAddress === addressModel.address ||
        generatedAddressWithCosmosPrefix === addressModel.address
      ) {
        try {
          // Generate sign doc from token and verify it against the signature
          const generatedSignDoc = await getADR036SignableSession(
            Buffer.from(sortedStringify(canvasSessionPayload)),
            generatedAddress,
          );

          const { pubkey, signature } = cosm.decodeSignature(stdSignature);
          const cosmCrypto = await import('@cosmjs/crypto');
          const secpSignature =
            cosmCrypto.Secp256k1Signature.fromFixedLength(signature);
          const messageHash = new cosmCrypto.Sha256(
            cosm.serializeSignDoc(generatedSignDoc),
          ).digest();
          isValid = await cosmCrypto.Secp256k1.verifySignature(
            secpSignature,
            messageHash,
            pubkey,
          );
          if (!isValid) {
            log.error('Signature mismatch.');
          }
        } catch (e) {
          log.error(`Signature verification failed: ${e.message}`);
          isValid = false;
        }
      } else {
        log.error(
          `Address not matched. Generated ${generatedAddress}, found ${addressModel.address}.`,
        );
        isValid = false;
      }
    }
  } else if (chain.base === ChainBase.Ethereum) {
    //
    // ethereum address handling
    //
    try {
      const signaturePattern = /^(.+)\/([A-Za-z0-9]+)\/(0x[A-Fa-f0-9]+)$/;
      const signaturePatternMatch = signaturePattern.exec(signatureString);
      if (signaturePatternMatch === null) {
        throw new Error(
          `Invalid signature: signature did not match ${signaturePattern}`,
        );
      }
      const [, domain, nonce, signatureData] = signaturePatternMatch;

      const siweMessage = createSiweMessage(
        canvasSessionPayload,
        domain,
        nonce,
      );

      if (addressModel.block_info !== sessionBlockInfo) {
        throw new Error(
          `Eth verification failed for ${addressModel.address}: signed a different block than expected`,
        );
      }

      const address = verifyMessage(siweMessage, signatureData);

      isValid = addressModel.address.toLowerCase() === address.toLowerCase();
      if (!isValid) {
        log.info(
          `Eth verification failed for ${addressModel.address}: does not match recovered address ${address}`,
        );
      }
    } catch (e) {
      log.info(
        `Eth verification failed for ${addressModel.address}: ${e.stack}`,
      );
      isValid = false;
    }
  } else if (chain.base === ChainBase.NEAR) {
    //
    // near address handling
    //

    // both in base64 encoding
    const nacl = await import('tweetnacl');
    const { signature: sigObj, publicKey } = JSON.parse(signatureString);

    isValid = nacl.sign.detached.verify(
      Buffer.from(sortedStringify(canvasSessionPayload)),
      Buffer.from(sigObj, 'base64'),
      Buffer.from(publicKey, 'base64'),
    );
  } else if (chain.base === ChainBase.Solana) {
    //
    // solana address handling
    //

    // ensure address is base58 string length 32, cf @solana/web3 impl
    try {
      const decodedAddress = bs58.decode(addressModel.address);
      if (decodedAddress.length === 32) {
        const nacl = await import('tweetnacl');
        isValid = nacl.sign.detached.verify(
          Buffer.from(sortedStringify(canvasSessionPayload)),
          bs58.decode(signatureString),
          decodedAddress,
        );
      } else {
        isValid = false;
      }
    } catch (e) {
      isValid = false;
    }
  } else {
    // invalid network
    log.error(`invalid network: ${chain.network}`);
    isValid = false;
  }

  addressModel.last_active = new Date();

  if (isValid && user_id === null) {
    // mark the address as verified, and if it doesn't have an associated user, create a new user
    addressModel.verification_token_expires = null;
    addressModel.verified = new Date();
    if (!addressModel.user_id) {
      const existingAddress = await models.Address.findOne({
        where: {
          address: addressModel.address,
          user_id: { [Sequelize.Op.ne]: null },
        },
      });
      if (existingAddress) {
        addressModel.user_id = existingAddress.user_id;
        addressModel.profile_id = existingAddress.profile_id;
      } else {
        const user = await models.User.createWithProfile(models, {
          email: null,
        });
        addressModel.profile_id = (user.Profiles[0] as ProfileAttributes).id;
        await models.Subscription.create({
          subscriber_id: user.id,
          category_id: NotificationCategories.NewMention,
          is_active: true,
        });
        await models.Subscription.create({
          subscriber_id: user.id,
          category_id: NotificationCategories.NewCollaboration,
          is_active: true,
        });
        addressModel.user_id = user.id;
      }
    }
  } else if (isValid) {
    // mark the address as verified
    addressModel.verification_token_expires = null;
    addressModel.verified = new Date();
    addressModel.user_id = user_id;
    const profile = await models.Profile.findOne({ where: { user_id } });
    addressModel.profile_id = profile.id;
  }
  await addressModel.save();
  return isValid;
};

export default verifySessionSignature;

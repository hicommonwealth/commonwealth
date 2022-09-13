import { Request, Response, NextFunction } from 'express';

import { StargateClient } from '@cosmjs/stargate';
import { bech32 } from 'bech32';
import bs58 from 'bs58';

import Keyring, { decodeAddress } from '@polkadot/keyring';
import { KeyringOptions } from '@polkadot/keyring/types';
import { stringToU8a, hexToU8a } from '@polkadot/util';
import { KeypairType } from '@polkadot/util-crypto/types';
import * as ethUtil from 'ethereumjs-util';
import {
  recoverTypedSignature,
  SignTypedDataVersion,
} from '@metamask/eth-sig-util';

import { Secp256k1, Secp256k1Signature, Sha256 } from '@cosmjs/crypto';
import {
  pubkeyToAddress,
  serializeSignDoc,
  decodeSignature,
  StdSignDoc,
} from '@cosmjs/amino';

import nacl from 'tweetnacl';


import {
  ChainBase,
  NotificationCategories,
  WalletId,
} from 'common-common/src/types';
import { factory, formatFilename } from 'common-common/src/logging';
import { addressSwapper } from '../../shared/utils';
import { ChainInstance } from '../models/chain';
import { ProfileAttributes } from '../models/profile';
import { AddressInstance } from '../models/address';
import { validationTokenToSignDoc } from '../../shared/adapters/chain/cosmos/keys';
import { constructTypedMessage } from '../../shared/adapters/chain/ethereum/keys';
import { DB } from '../database';
import { DynamicTemplate } from '../../shared/types';
import { AppError, ServerError } from '../util/errors';
import { mixpanelTrack } from '../util/mixpanelUtil';
import { MixpanelLoginEvent } from '../../shared/analytics/types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sgMail = require('@sendgrid/mail');
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoChain: 'Must provide chain',
  InvalidChain: 'Invalid chain',
  AddressNF: 'Address not found',
  ExpiredToken: 'Token has expired, please re-register',
  InvalidSignature: 'Invalid signature, please re-register',
  NoEmail: 'No email to alert',
  InvalidArguments: 'Invalid arguments',
  CouldNotVerifySignature: 'Failed to verify signature',
  BadSecret: 'Invalid jwt secret',
  BadToken: 'Invalid login token',
  WrongWallet: 'Verified with different wallet than created',
};

// Address.verifySignature
const verifySignature = async (
  models: DB,
  chain: ChainInstance,
  addressModel: AddressInstance,
  user_id: number,
  signatureString: string
): Promise<boolean> => {
  if (!chain) {
    log.error('no chain provided to verifySignature');
    return false;
  }

  let isValid: boolean;
  if (chain.base === ChainBase.Substrate) {
    //
    // substrate address handling
    //
    const address = decodeAddress(addressModel.address);
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
      const signerKeyring = new Keyring(keyringOptions).addFromAddress(address);
      const signedMessageNewline = stringToU8a(
        `${addressModel.verification_token}\n`
      );
      const signedMessageNoNewline = stringToU8a(
        addressModel.verification_token
      );
      const signatureU8a =
        signatureString.slice(0, 2) === '0x'
          ? hexToU8a(signatureString)
          : hexToU8a(`0x${signatureString}`);
      isValid =
        signerKeyring.verify(signedMessageNewline, signatureU8a, address) ||
        signerKeyring.verify(signedMessageNoNewline, signatureU8a, address);
    } else {
      log.error('Invalid keytype.');
      isValid = false;
    }
  } else if (
    chain.base === ChainBase.CosmosSDK &&
    (addressModel.wallet_id === WalletId.CosmosEvmMetamask || addressModel.wallet_id === WalletId.KeplrEthereum)
  ) {
    //
    // ethereum address handling on cosmos chains via metamask
    //
    console.log(signatureString);
    const msgBuffer = Buffer.from(addressModel.verification_token.trim());
    // toBuffer() doesn't work if there is a newline
    const msgHash = ethUtil.hashPersonalMessage(msgBuffer);
    const ethSignatureParams = ethUtil.fromRpcSig(signatureString.trim());
    const publicKey = ethUtil.ecrecover(
      msgHash,
      ethSignatureParams.v,
      ethSignatureParams.r,
      ethSignatureParams.s
    );

    const addressBuffer = ethUtil.publicToAddress(publicKey);
    const lowercaseAddress = ethUtil.bufferToHex(addressBuffer);
    try {
      // const ethAddress = Web3.utils.toChecksumAddress(lowercaseAddress);
      const b32AddrBuf = ethUtil.Address.fromString(
        lowercaseAddress.toString()
      ).toBuffer();
      const b32Address = bech32.encode(
        chain.bech32_prefix,
        bech32.toWords(b32AddrBuf)
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
    const { signature: stdSignature } = JSON.parse(signatureString);

    // we generate an address from the actual public key and verify that it matches,
    // this prevents people from using a different key to sign the message than
    // the account they registered with.
    // TODO: ensure ion works
    const bech32Prefix = chain.bech32_prefix;
    if (!bech32Prefix) {
      log.error('No bech32 prefix found.');
      isValid = false;
    } else {
      const generatedAddress = pubkeyToAddress(
        stdSignature.pub_key,
        bech32Prefix
      );

      if (generatedAddress === addressModel.address) {
        try {
          // directly verify the generated signature, generated via SignBytes
          const { pubkey, signature } = decodeSignature(stdSignature);
          const secpSignature = Secp256k1Signature.fromFixedLength(signature);
          const messageHash = new Sha256(
            Buffer.from(addressModel.verification_token.trim())
          ).digest();

          isValid = await Secp256k1.verifySignature(
            secpSignature,
            messageHash,
            pubkey
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

    const { signature: stdSignature } = JSON.parse(signatureString);

    const bech32Prefix = chain.bech32_prefix;
    if (!bech32Prefix) {
      log.error('No bech32 prefix found.');
      isValid = false;
    } else {
      const generatedAddress = pubkeyToAddress(
        stdSignature.pub_key,
        bech32Prefix
      );
      const generatedAddressWithCosmosPrefix = pubkeyToAddress(
        stdSignature.pub_key,
        'cosmos'
      );

      if (
        generatedAddress === addressModel.address ||
        generatedAddressWithCosmosPrefix === addressModel.address
      ) {
        let generatedSignDoc: StdSignDoc;

        try {
          // Generate sign doc from token and verify it against the signature
          generatedSignDoc = validationTokenToSignDoc(
            Buffer.from(addressModel.verification_token.trim()),
            generatedAddress
          );

          const { pubkey, signature } = decodeSignature(stdSignature);
          const secpSignature = Secp256k1Signature.fromFixedLength(signature);
          const messageHash = new Sha256(
            serializeSignDoc(generatedSignDoc)
          ).digest();

          isValid = await Secp256k1.verifySignature(
            secpSignature,
            messageHash,
            pubkey
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
          `Address not matched. Generated ${generatedAddress}, found ${addressModel.address}.`
        );
        isValid = false;
      }
    }
  } else if (chain.base === ChainBase.Ethereum) {
    //
    // ethereum address handling
    //
    try {
      const node = await chain.getChainNode();
      const typedMessage = constructTypedMessage(
        node.eth_chain_id || 1,
        addressModel.verification_token.trim()
      );
      const address = recoverTypedSignature({
        data: typedMessage,
        signature: signatureString.trim(),
        version: SignTypedDataVersion.V4,
      });
      isValid = addressModel.address.toLowerCase() === address.toLowerCase();
      if (!isValid) {
        log.info(
          `Eth verification failed for ${addressModel.address}: does not match recovered address ${address}`
        );
      }
    } catch (e) {
      log.info(
        `Eth verification failed for ${addressModel.address}: ${e.message}`
      );
      isValid = false;
    }
  } else if (chain.base === ChainBase.NEAR) {
    //
    // near address handling
    //

    // both in base64 encoding
    const { signature: sigObj, publicKey } = JSON.parse(signatureString);
    isValid = nacl.sign.detached.verify(
      Buffer.from(`${addressModel.verification_token}\n`),
      Buffer.from(sigObj, 'base64'),
      Buffer.from(publicKey, 'base64')
    );
  } else if (chain.base === ChainBase.Solana) {
    //
    // solana address handling
    //

    // ensure address is base58 string length 32, cf @solana/web3 impl
    try {
      const decodedAddress = bs58.decode(addressModel.address);
      if (decodedAddress.length === 32) {
        isValid = nacl.sign.detached.verify(
          Buffer.from(`${addressModel.verification_token}`),
          Buffer.from(signatureString, 'base64'),
          decodedAddress
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
      const user = await models.User.createWithProfile(models, { email: null });
      addressModel.profile_id = (user.Profiles[0] as ProfileAttributes).id;
      await models.Subscription.create({
        subscriber_id: user.id,
        category_id: NotificationCategories.NewMention,
        object_id: `user-${user.id}`,
        is_active: true,
      });
      await models.Subscription.create({
        subscriber_id: user.id,
        category_id: NotificationCategories.NewCollaboration,
        object_id: `user-${user.id}`,
        is_active: true,
      });
      // Automatically create subscription to chat mentions
      await models.Subscription.create({
        subscriber_id: user.id,
        category_id: NotificationCategories.NewChatMention,
        object_id: `user-${user.id}`,
        is_active: true,
      });
      addressModel.user_id = user.id;
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

const processAddress = async (
  models: DB,
  chain: ChainInstance,
  address: string,
  wallet_id: WalletId,
  signature?: string,
  user?: Express.User
): Promise<void> => {
  const existingAddress = await models.Address.scope('withPrivateData').findOne(
    {
      where: { chain: chain.id, address },
    }
  );
  if (!existingAddress) {
    throw new AppError(Errors.AddressNF);
  }
  if (existingAddress.wallet_id !== wallet_id) {
    throw new AppError(Errors.WrongWallet);
  }

  // first, check whether the token has expired
  // (certain login methods e.g. jwt have no expiration token, so we skip the check in that case)
  const expiration = existingAddress.verification_token_expires;
  if (expiration && +expiration <= +new Date()) {
    throw new AppError(Errors.ExpiredToken);
  }
  // check for validity
  const isAddressTransfer =
    !!existingAddress.verified && user && existingAddress.user_id !== user.id;
  const oldId = existingAddress.user_id;
  try {
    const valid = await verifySignature(
      models,
      chain,
      existingAddress,
      user ? user.id : null,
      signature
    );
    if (!valid) {
      throw new AppError(Errors.InvalidSignature);
    }
  } catch (e) {
    log.warn(`Failed to verify signature for ${address}: ${e.message}`);
    throw new AppError(Errors.CouldNotVerifySignature);
  }

  // if someone else already verified it, send an email letting them know ownership
  // has been transferred to someone else
  if (isAddressTransfer) {
    try {
      const oldUser = await models.User.scope('withPrivateData').findOne({
        where: { id: oldId },
      });
      if (!oldUser) {
        // users who register thru github don't have emails by default
        throw new AppError(Errors.NoEmail);
      }
      const msg = {
        to: user.email,
        from: 'Commonwealth <no-reply@commonwealth.im>',
        templateId: DynamicTemplate.VerifyAddress,
        dynamic_template_data: {
          address,
          chain: chain.name,
        },
      };
      await sgMail.send(msg);
      log.info(
        `Sent address move email: ${address} transferred to a new account`
      );
    } catch (e) {
      log.error(`Could not send address move email for: ${address}`);
    }
  }
};

const verifyAddress = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.body.chain) {
    throw new AppError(Errors.NoChain);
  }
  const chain = await models.Chain.findOne({
    where: { id: req.body.chain },
  });
  if (!chain) {
    return next(new AppError(Errors.InvalidChain));
  }

  if (!req.body.address || !req.body.signature) {
    throw new AppError(Errors.InvalidArguments);
  }

  const address =
    chain.base === ChainBase.Substrate
      ? addressSwapper({
          address: req.body.address,
          currentPrefix: chain.ss58_prefix,
        })
      : req.body.address;
  await processAddress(
    models,
    chain,
    address,
    req.body.wallet_id,
    req.body.signature,
    req.user
  );

  if (req.user) {
    // if user was already logged in, we're done
    return res.json({
      status: 'Success',
      result: { address, message: 'Verified signature' },
    });
  } else {
    // if user isn't logged in, log them in now
    const newAddress = await models.Address.findOne({
      where: { chain: req.body.chain, address },
    });
    const user = await models.User.scope('withPrivateData').findOne({
      where: { id: newAddress.user_id },
    });
    req.login(user, (err) => {
      if (err) return next(err);
      if (process.env.NODE_ENV !== 'test') {
        mixpanelTrack({
          event: MixpanelLoginEvent.LOGIN,
          isCustomDomain: null,
        });
      }
      // mixpanelPeopleSet(req.user.id.toString());
      return res.json({
        status: 'Success',
        result: {
          user,
          address,
          message: 'Logged in',
        },
      });
    });
  }
};

export default verifyAddress;

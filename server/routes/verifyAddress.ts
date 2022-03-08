(global as any).window = { location: { href: '/' } };

import { Request, Response, NextFunction } from 'express';
import { StargateClient } from '@cosmjs/stargate';
import Web3 from 'web3';
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
  AminoSignResponse,
  pubkeyToAddress,
  serializeSignDoc,
  decodeSignature,
} from '@cosmjs/amino';

import nacl from 'tweetnacl';

import { ChainInstance } from '../models/chain';
import { ProfileAttributes } from '../models/profile';
import { AddressInstance } from '../models/address';
import { validationTokenToSignDoc } from '../../shared/adapters/chain/cosmos/keys';
import { constructTypedMessage } from '../../shared/adapters/chain/ethereum/keys';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';
import {
  DynamicTemplate,
  ChainBase,
  NotificationCategories,
  ChainNetwork,
} from '../../shared/types';
import AddressSwapper from '../util/addressSwapper';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sgMail = require('@sendgrid/mail');
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoAddress: 'Must provide address',
  NoChain: 'Must provide chain',
  InvalidChain: 'Invalid chain',
  NoSignature: 'Must provide signature',
  AddressNF: 'Address not found',
  ExpiredToken: 'Token has expired, please re-register',
  InvalidSignature: 'Invalid signature, please re-register',
  NoEmail: 'No email to alert',
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
    (chain.network === ChainNetwork.Injective ||
      chain.network === ChainNetwork.InjectiveTestnet)
  ) {
    //
    // ethereum address handling
    //
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
      const injAddrBuf = ethUtil.Address.fromString(
        lowercaseAddress.toString()
      ).toBuffer();
      const injAddress = bech32.encode('inj', bech32.toWords(injAddrBuf));
      if (addressModel.address === injAddress) isValid = true;
    } catch (e) {
      isValid = false;
    }
  } else if (chain.base === ChainBase.CosmosSDK) {
    //
    // cosmos-sdk address handling
    //

    // provided string should be serialized AminoSignResponse object
    const { signed, signature: stdSignature }: AminoSignResponse =
      JSON.parse(signatureString);

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
      const generatedAddressWithCosmosPrefix = pubkeyToAddress(
        stdSignature.pub_key,
        'cosmos'
      );

      if (
        generatedAddress === addressModel.address ||
        generatedAddressWithCosmosPrefix === addressModel.address
      ) {
        // query chain ID from URL
        const [node] = await chain.getChainNodes();
        const client = await StargateClient.connect(node.url);
        const chainId = await client.getChainId();
        client.disconnect();

        const generatedSignDoc = validationTokenToSignDoc(
          chainId,
          addressModel.verification_token.trim(),
          signed.fee,
          signed.memo,
          <any>signed.msgs
        );

        // ensure correct document was signed
        if (
          serializeSignDoc(signed).toString() ===
          serializeSignDoc(generatedSignDoc).toString()
        ) {
          // ensure valid signature
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
            log.error('Signature verification failed.');
          }
        } else {
          log.error(
            `Sign doc not matched. Generated: ${JSON.stringify(
              generatedSignDoc
            )}, found: ${JSON.stringify(signed)}.`
          );
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
      const [node] = await chain.getChainNodes();
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

const verifyAddress = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Verify that a linked address is actually owned by its supposed user.
  if (!req.body.address) {
    return next(new Error(Errors.NoAddress));
  }
  if (!req.body.chain) {
    return next(new Error(Errors.NoChain));
  }
  if (!req.body.signature) {
    return next(new Error(Errors.NoSignature));
  }

  const chain = await models.Chain.findOne({
    where: { id: req.body.chain },
  });
  if (!chain) {
    return next(new Error(Errors.InvalidChain));
  }

  const encodedAddress =
    chain.base === ChainBase.Substrate
      ? AddressSwapper({
          address: req.body.address,
          currentPrefix: chain.ss58_prefix,
        })
      : req.body.address;

  const existingAddress = await models.Address.scope('withPrivateData').findOne(
    {
      where: { chain: req.body.chain, address: encodedAddress },
    }
  );
  if (!existingAddress) {
    return next(new Error(Errors.AddressNF));
  } else {
    // first, check whether the token has expired
    const expiration = existingAddress.verification_token_expires;
    if (expiration && +expiration <= +new Date()) {
      return next(new Error(Errors.ExpiredToken));
    }
    // check for validity
    const isAddressTransfer =
      !!existingAddress.verified &&
      req.user &&
      existingAddress.user_id !== req.user.id;
    const oldId = existingAddress.user_id;
    try {
      const valid = await verifySignature(
        models,
        chain,
        existingAddress,
        req.user ? req.user.id : null,
        req.body.signature
      );
      if (!valid) {
        return next(new Error(Errors.InvalidSignature));
      }
    } catch (e) {
      return next(e);
    }

    // if someone else already verified it, send an email letting them know ownership
    // has been transferred to someone else
    if (isAddressTransfer) {
      try {
        const user = await models.User.scope('withPrivateData').findOne({
          where: { id: oldId },
        });
        if (!user.email) {
          // users who register thru github don't have emails by default
          throw new Error(Errors.NoEmail);
        }
        const msg = {
          to: user.email,
          from: 'Commonwealth <no-reply@commonwealth.im>',
          templateId: DynamicTemplate.VerifyAddress,
          dynamic_template_data: {
            address: req.body.address,
            chain: chain.name,
          },
        };
        await sgMail.send(msg);
        log.info(
          `Sent address move email: ${req.body.address} transferred to a new account`
        );
      } catch (e) {
        log.error(`Could not send address move email for: ${req.body.address}`);
      }
    }

    if (req.user) {
      // if user was already logged in, we're done
      return res.json({ status: 'Success', result: 'Verified signature' });
    } else {
      // if user isn't logged in, log them in now
      const newAddress = await models.Address.findOne({
        where: { chain: req.body.chain, address: encodedAddress },
      });
      const user = await models.User.scope('withPrivateData').findOne({
        where: { id: newAddress.user_id },
      });
      req.login(user, (err) => {
        if (err) return next(err);
        return res.json({
          status: 'Success',
          result: {
            user,
            message: 'Logged in',
          },
        });
      });
    }
  }
};

export default verifyAddress;

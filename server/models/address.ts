(global as any).window = { location: { href: '/' } };

import * as Sequelize from 'sequelize';
import crypto from 'crypto';
import Web3 from 'web3';

import Keyring, { decodeAddress } from '@polkadot/keyring';
import { stringToU8a, hexToU8a } from '@polkadot/util';

import { serializeSignDoc, decodeSignature } from '@cosmjs/launchpad';
import { Secp256k1, Secp256k1Signature, Sha256 } from '@cosmjs/crypto';
import { fromBase64 } from '@cosmjs/encoding';
import { getCosmosAddress } from '@lunie/cosmos-keys'; // used to check address validity. TODO: remove

import nacl from 'tweetnacl';
import { KeyringOptions } from '@polkadot/keyring/types';
import { NotificationCategories } from '../../shared/types';
import { ADDRESS_TOKEN_EXPIRES_IN } from '../config';
import { ChainAttributes, ChainInstance } from './chain';
import { UserAttributes } from './user';
import { OffchainProfileAttributes } from './offchain_profile';
import { RoleAttributes } from './role';
import { factory, formatFilename } from '../../shared/logging';
import { validationTokenToSignDoc } from '../../shared/adapters/chain/cosmos/keys';
const log = factory.getLogger(formatFilename(__filename));

// tslint:disable-next-line
const ethUtil = require('ethereumjs-util');

export interface AddressAttributes {
  id?: number;
  address: string;
  chain: string;
  verification_token: string;
  verification_token_expires?: Date;
  verified?: Date;
  keytype?: string;
  name?: string;
  last_active?: Date;
  created_at?: Date;
  updated_at?: Date;
  user_id?: number;
  is_councillor?: boolean;
  is_validator?: boolean;
  is_magic?: boolean;

  // associations
  Chain?: ChainAttributes;
  User?: UserAttributes;
  OffchainProfile?: OffchainProfileAttributes;
  Roles?: RoleAttributes[];
}

export interface AddressInstance extends Sequelize.Instance<AddressAttributes>, AddressAttributes {
  // no mixins used yet
}

export interface AddressModel extends Sequelize.Model<AddressInstance, AddressAttributes> {
  // static methods
  createEmpty?: (
    chain: string,
    address: string,
  ) => Promise<AddressInstance>;

  createWithToken?: (
    user_id: number,
    chain: string,
    address: string,
    keytype?: string
  ) => Promise<AddressInstance>;

  updateWithToken?: (
    address: AddressInstance,
    user_id?: number,
    keytype?: string
  ) => Promise<AddressInstance>;

  updateWithTokenProvided?: (
    address: AddressInstance,
    user_id: number,
    keytype?: string,
    verification_token?: string,
    verification_token_expires?: Date
  ) => Promise<AddressInstance>;

  verifySignature?: (
    models: Sequelize.Models,
    chain: ChainInstance,
    addressModel: AddressInstance,
    user_id: number,
    signatureString: string,
  ) => Promise<boolean>;
}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): AddressModel => {
  const Address: AddressModel = sequelize.define<AddressInstance, AddressAttributes>('Address', {
    id:                         { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    address:                    { type: dataTypes.STRING, allowNull: false },
    chain:                      { type: dataTypes.STRING, allowNull: false },
    verification_token:         { type: dataTypes.STRING, allowNull: false },
    verification_token_expires: { type: dataTypes.DATE, allowNull: true },
    verified:                   { type: dataTypes.DATE, allowNull: true },
    keytype:                    { type: dataTypes.STRING, allowNull: true },
    name:                       { type: dataTypes.STRING, allowNull: true },
    last_active:                { type: dataTypes.DATE, allowNull: true },
    created_at:                 { type: dataTypes.DATE, allowNull: false },
    updated_at:                 { type: dataTypes.DATE, allowNull: false },
    user_id:                    { type: dataTypes.INTEGER, allowNull: true },
    is_councillor:              { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_validator:               { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_magic:                   { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  }, {
    underscored: true,
    indexes: [
      { fields: ['address', 'chain'], unique: true },
      { fields: ['user_id'] },
      { fields: ['name'] }
    ],
    defaultScope: {
      attributes: {
        exclude: [ 'verification_token', 'verification_token_expires', 'created_at', 'updated_at' ],
      }
    },
    scopes: {
      withPrivateData: {
        attributes: {}
      }
    },
  });

  Address.createEmpty = (
    chain: string,
    address: string,
  ): Promise<AddressInstance> => {
    const verification_token = 'NO_USER';
    const verification_token_expires = new Date(); // expired immediately
    return Address.create({ chain, address, verification_token, verification_token_expires });
  };

  Address.createWithToken = (
    user_id: number,
    chain: string,
    address: string,
    keytype?: string,
  ): Promise<AddressInstance> => {
    const verification_token = crypto.randomBytes(18).toString('hex');
    const verification_token_expires = new Date(+(new Date()) + ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000);
    const last_active = new Date();
    return Address.create({
      user_id, chain, address, verification_token, verification_token_expires, keytype, last_active,
    });
  };

  // Update an existing address' verification token
  Address.updateWithToken = (
    address: AddressInstance,
    user_id?: number,
    keytype?: string,
  ): Promise<AddressInstance> => {
    const verification_token = crypto.randomBytes(18).toString('hex');
    const verification_token_expires = new Date(+(new Date()) + ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000);
    if (user_id) {
      address.user_id = user_id;
    }
    address.keytype = keytype;
    address.verification_token = verification_token;
    address.verification_token_expires = verification_token_expires;
    address.last_active = new Date();

    return address.save();
  };

  // Update an existing address' verification token with provided one
  Address.updateWithTokenProvided = (
    address: AddressInstance,
    user_id: number,
    keytype?: string,
    verification_token?: string,
    verification_token_expires?: Date
  ): Promise<AddressInstance> => {
    address.user_id = user_id;
    address.keytype = keytype;
    address.verification_token = verification_token;
    address.verification_token_expires = verification_token_expires;
    address.last_active = new Date();

    return address.save();
  };

  // Verify an address' verification token. Requires some data to be
  // passed from the frontend to show exactly what was signed.
  // Supports Substrate, Ethereum, Cosmos, and NEAR.
  Address.verifySignature = async (
    models: Sequelize.Models,
    chain: ChainInstance,
    addressModel: AddressInstance,
    user_id: number,
    signatureString: string,
  ): Promise<boolean> => {
    if (!chain) {
      log.error('no chain provided to verifySignature');
      return false;
    }

    let isValid;
    if (chain.base === 'substrate') {
      //
      // substrate address handling
      //
      const address = decodeAddress(addressModel.address);
      const keyringOptions: KeyringOptions = { type: 'sr25519' };
      if (addressModel.keytype) {
        if (addressModel.keytype !== 'sr25519' && addressModel.keytype !== 'ed25519') {
          log.error('invalid keytype');
          return false;
        }
        keyringOptions.type = addressModel.keytype;
      }
      keyringOptions.ss58Format = chain.ss58_prefix ?? 42;
      const signerKeyring = new Keyring(keyringOptions).addFromAddress(address);
      const signedMessageNewline = stringToU8a(`${addressModel.verification_token}\n`);
      const signedMessageNoNewline = stringToU8a(addressModel.verification_token);
      const signatureU8a = signatureString.slice(0, 2) === '0x'
        ? hexToU8a(signatureString)
        : hexToU8a(`0x${signatureString}`);
      isValid = signerKeyring.verify(signedMessageNewline, signatureU8a, address)
        || signerKeyring.verify(signedMessageNoNewline, signatureU8a, address);
    } else if (chain.base === 'cosmos') {
      //
      // cosmos-sdk address handling
      //
      const signatureData = JSON.parse(signatureString);
      const pk = Buffer.from(signatureData.signature.pub_key.value, 'base64');

      // we generate an address from the actual public key and verify that it matches,
      // this prevents people from using a different key to sign the message than
      // the account they registered with.
      const bech32Prefix = chain.network === 'cosmos'
        ? 'cosmos'
        : chain.network === 'straightedge' ? 'str' : chain.network;
      const generatedAddress = getCosmosAddress(pk, bech32Prefix);
      const generatedAddressWithCosmosPrefix = getCosmosAddress(pk, 'cosmos');

      if (generatedAddress === addressModel.address || generatedAddressWithCosmosPrefix === addressModel.address) {
        // get tx doc that was signed
        const signDoc = await validationTokenToSignDoc(addressModel.address, addressModel.verification_token.trim());

        // check for signature validity
        // see the last test in @cosmjs/launchpad/src/secp256k1wallet.spec.ts for reference
        const { pubkey, signature } = decodeSignature(signatureData.signature);
        const secpSignature = Secp256k1Signature.fromFixedLength(fromBase64(signatureData.signature.signature));
        if (serializeSignDoc(signatureData.signed).toString() !== serializeSignDoc(signDoc).toString()) {
          isValid = false;
        } else {
          const messageHash = new Sha256(serializeSignDoc(signDoc)).digest();
          isValid = await Secp256k1.verifySignature(secpSignature, messageHash, pubkey);
        }
      } else {
        isValid = false;
      }
    } else if (chain.network === 'ethereum'
      || chain.network === 'moloch'
      || chain.network === 'alex'
      || chain.network === 'yearn'
      || chain.network === 'fei'
      || chain.network === 'sushi'
      || chain.network === 'metacartel'
      || chain.network === 'commonwealth'
      || chain.type === 'token'
      || chain.network === 'demo'
    ) {
      //
      // ethereum address handling
      //
      const msgBuffer = Buffer.from(addressModel.verification_token.trim());
      // toBuffer() doesn't work if there is a newline
      const msgHash = ethUtil.hashPersonalMessage(msgBuffer);
      const ethSignatureBuffer = ethUtil.toBuffer(signatureString.trim());
      const ethSignatureParams = ethUtil.fromRpcSig(ethSignatureBuffer);
      const publicKey = ethUtil.ecrecover(
        msgHash,
        ethSignatureParams.v,
        ethSignatureParams.r,
        ethSignatureParams.s
      );
      const addressBuffer = ethUtil.publicToAddress(publicKey);
      const lowercaseAddress = ethUtil.bufferToHex(addressBuffer);
      try {
        const address = Web3.utils.toChecksumAddress(lowercaseAddress);
        isValid = (addressModel.address === address);
      } catch (e) {
        isValid = false;
      }
    } else if (chain.base === 'near') {
      // both in base64 encoding
      const { signature: sigObj, publicKey } = JSON.parse(signatureString);
      isValid = nacl.sign.detached.verify(
        Buffer.from(`${addressModel.verification_token}\n`),
        Buffer.from(sigObj, 'base64'),
        Buffer.from(publicKey, 'base64'),
      );
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
        const user = await models.User.create({ email: null });
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
    }
    await addressModel.save();
    return isValid;
  };

  Address.associate = (models) => {
    models.Address.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
    models.Address.belongsTo(models.User, { foreignKey: 'user_id', targetKey: 'id' });
    models.Address.hasOne(models.OffchainProfile);
    models.Address.hasMany(models.Role, { foreignKey: 'address_id' });
    models.Address.belongsToMany(models.OffchainThread, {
      through: models.Collaboration,
      as: 'collaboration'
    });
    models.Address.hasMany(models.Collaboration);
  };

  return Address;
};

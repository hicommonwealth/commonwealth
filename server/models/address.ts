(global as any).window = { location: { href: '/' } };

import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import crypto from 'crypto';
import Web3 from 'web3';

import Keyring, { decodeAddress } from '@polkadot/keyring';
import { stringToU8a, hexToU8a } from '@polkadot/util';
import { KeypairType } from '@polkadot/util-crypto/types';

import { serializeSignDoc, decodeSignature } from '@cosmjs/launchpad';
import { Secp256k1, Secp256k1Signature, Sha256 } from '@cosmjs/crypto';
import { AminoSignResponse, pubkeyToAddress } from '@cosmjs/amino';

import nacl from 'tweetnacl';
import { KeyringOptions } from '@polkadot/keyring/types';
import { NotificationCategories } from '../../shared/types';
import { ModelStatic } from './types';
import { ADDRESS_TOKEN_EXPIRES_IN } from '../config';
import { ChainAttributes, ChainInstance } from './chain';
import {UserAttributes, UserInstance} from './user';
import {OffchainProfileAttributes, OffchainProfileInstance} from './offchain_profile';
import {RoleAttributes, RoleInstance} from './role';
import { factory, formatFilename } from '../../shared/logging';
import { validationTokenToSignDoc } from '../../shared/adapters/chain/cosmos/keys';
const log = factory.getLogger(formatFilename(__filename));

// tslint:disable-next-line
const ethUtil = require('ethereumjs-util');

export interface AddressAttributes {
  address: string;
  chain: string;
  verification_token: string;
  id?: number;
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

export interface AddressInstance extends Model<AddressAttributes>, AddressCreationAttributes {
  // no mixins used yet
  getChain: Sequelize.BelongsToGetAssociationMixin<ChainInstance>;
  getUser: Sequelize.BelongsToGetAssociationMixin<UserInstance>;
  getOffchainProfile: Sequelize.BelongsToGetAssociationMixin<OffchainProfileInstance>;
  getRoles: Sequelize.HasManyGetAssociationsMixin<RoleInstance>;
}

export interface AddressCreationAttributes extends AddressAttributes {
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
    models: any,
    chain: ChainInstance,
    addressModel: AddressInstance,
    user_id: number,
    signatureString: string,
  ) => Promise<boolean>;
}

export type AddressModelStatic = ModelStatic<AddressInstance> & AddressCreationAttributes

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): AddressModelStatic => {
  const Address: AddressModelStatic = <AddressModelStatic>sequelize.define('Address', {
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
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    tableName: 'Addresses',
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
      withPrivateData: {}
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
    models: any,
    chain: ChainInstance,
    addressModel: AddressInstance,
    user_id: number,
    signatureString: string,
  ): Promise<boolean> => {
    if (!chain) {
      log.error('no chain provided to verifySignature');
      return false;
    }

    let isValid: boolean;
    if (chain.base === 'substrate') {
      //
      // substrate address handling
      //
      const address = decodeAddress(addressModel.address);
      const keyringOptions: KeyringOptions = { type: 'sr25519' };
      if (!addressModel.keytype || (addressModel.keytype === 'sr25519' || addressModel.keytype === 'ed25519')) {
        if (addressModel.keytype) {
          keyringOptions.type = addressModel.keytype as KeypairType;
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
      } else {
        log.error('Invalid keytype.');
        isValid = false;
      }
    } else if (chain.base === 'cosmos') {
      //
      // cosmos-sdk address handling
      //

      // provided string should be serialized AminoSignResponse object
      const { signed, signature: stdSignature }: AminoSignResponse = JSON.parse(signatureString);

      // we generate an address from the actual public key and verify that it matches,
      // this prevents people from using a different key to sign the message than
      // the account they registered with.
      // TODO: ensure osmosis works
      const bech32Prefix = chain.network === 'straightedge'
        ? 'str'
        : chain.network === 'osmosis'
          ? 'osmo'
          : chain.network === 'injective'
            ? 'inj'
            : chain.network;
      const generatedAddress = pubkeyToAddress(stdSignature.pub_key, bech32Prefix);
      const generatedAddressWithCosmosPrefix = pubkeyToAddress(stdSignature.pub_key, 'cosmos');

      if (generatedAddress === addressModel.address || generatedAddressWithCosmosPrefix === addressModel.address) {
        const generatedSignDoc = validationTokenToSignDoc(
          chain.id,
          addressModel.verification_token.trim(),
          signed.fee,
          signed.memo,
        );

        // ensure correct document was signed
        if (serializeSignDoc(signed).toString() === serializeSignDoc(generatedSignDoc).toString()) {
          // ensure valid signature
          // see the last test in @cosmjs/launchpad/src/secp256k1wallet.spec.ts for reference
          const { pubkey, signature } = decodeSignature(stdSignature);
          const secpSignature = Secp256k1Signature.fromFixedLength(signature);
          const messageHash = new Sha256(serializeSignDoc(generatedSignDoc)).digest();
          isValid = await Secp256k1.verifySignature(secpSignature, messageHash, pubkey);
          if (!isValid) {
            log.error('Signature verification failed.');
          }
        } else {
          log.error(`Sign doc not matched. Generated: ${
            JSON.stringify(generatedSignDoc)
          }, found: ${
            JSON.stringify(signed)
          }.`);
          isValid = false;
        }
      } else {
        log.error(`Address not matched. Generated ${generatedAddress}, found ${addressModel.address}.`);
        isValid = false;
      }
    } else if (chain.base === 'ethereum') {
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

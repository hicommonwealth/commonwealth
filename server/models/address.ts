(global as any).window = {};

import * as Sequelize from 'sequelize';
import crypto from 'crypto';

import Keyring, { decodeAddress } from '@polkadot/keyring';
import { stringToU8a, hexToU8a } from '@polkadot/util';

import * as secp256k1 from 'secp256k1';
import * as CryptoJS from 'crypto-js';

import { getCosmosAddress } from '@lunie/cosmos-keys';
import nacl from 'tweetnacl';
import { KeyringOptions } from '@polkadot/keyring/types';
import { keyToSignMsg } from '../../shared/adapters/chain/cosmos/keys';
import { NotificationCategories } from '../../shared/types';
import { ADDRESS_TOKEN_EXPIRES_IN } from '../config';
import { ChainAttributes, ChainInstance } from './chain';
import { UserAttributes } from './user';
import { OffchainProfileAttributes } from './offchain_profile';
import { RoleAttributes } from './role';
import { factory, formatFilename } from '../../shared/logging';
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
  }, {
    underscored: true,
    indexes: [
      { fields: ['address', 'chain'], unique: true },
      { fields: ['user_id'] },
      { fields: ['name'] }
    ]
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
    keytype?: string
  ): Promise<AddressInstance> => {
    const verification_token = crypto.randomBytes(18).toString('hex');
    const verification_token_expires = new Date(+(new Date()) + ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000);
    const last_active = new Date();
    return Address.create({ user_id, chain, address, verification_token, verification_token_expires, keytype, last_active });
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
    if (chain.network === 'edgeware' || chain.network === 'kusama' || chain.network === 'polkadot'
        || chain.network === 'kulupu' || chain.network === 'plasm' || chain.network === 'stafi'
        || chain.network === 'darwinia' || chain.network === 'phala' || chain.network === 'centrifuge') {
      const address = decodeAddress(addressModel.address);
      const keyringOptions: KeyringOptions = { type: 'sr25519' };
      if (addressModel.keytype) {
        if (addressModel.keytype !== 'sr25519' && addressModel.keytype !== 'ed25519') {
          log.error('invalid keytype');
          return false;
        }
        keyringOptions.type = addressModel.keytype;
      }
      if (chain.network === 'kusama') {
        keyringOptions.ss58Format = 2;
      } else if (chain.network === 'edgeware') {
        keyringOptions.ss58Format = 7; // edgeware chain id
      } else if (chain.network === 'polkadot') {
        keyringOptions.ss58Format = 0;
      } else if (chain.network === 'kulupu') {
        keyringOptions.ss58Format = 16;
      } else if (chain.network === 'plasm') {
        keyringOptions.ss58Format = 5;
      } else if (chain.network === 'stafi') {
        keyringOptions.ss58Format = 20;
      } else if (chain.network === 'darwinia') {
        keyringOptions.ss58Format = 18;
      } else if (chain.network === 'phala') {
        keyringOptions.ss58Format = 30;
      } else if (chain.network === 'centrifuge') {
        keyringOptions.ss58Format = 36;
      } else {
        keyringOptions.ss58Format = 42; // default chain id
      }
      const signerKeyring = new Keyring(keyringOptions).addFromAddress(address);
      const signedMessageNewline = stringToU8a(`${addressModel.verification_token}\n`);
      const signedMessageNoNewline = stringToU8a(addressModel.verification_token);
      const signatureU8a = signatureString.slice(0, 2) === '0x'
        ? hexToU8a(signatureString)
        : hexToU8a(`0x${signatureString}`);
      isValid = signerKeyring.verify(signedMessageNewline, signatureU8a)
        || signerKeyring.verify(signedMessageNoNewline, signatureU8a);
    } else if (chain.network === 'cosmos') {
      const signatureData = JSON.parse(signatureString);
      // this saved "address" is actually just the address
      const msg = keyToSignMsg(addressModel.address, addressModel.verification_token);
      const signature = Buffer.from(signatureData.signature, 'base64');
      const pk = Buffer.from(signatureData.pub_key.value, 'base64');

      // we generate an address from the actual public key and verify that it matches,
      // this prevents people from using a different key to sign the message than
      // the account they registered with
      const generatedAddress = getCosmosAddress(pk);
      if (generatedAddress === addressModel.address) {
        const signHash = Buffer.from(CryptoJS.SHA256(msg).toString(), `hex`);
        isValid = secp256k1.ecdsaVerify(signHash, signature, pk);
      } else {
        isValid = false;
      }
    } else if (chain.network === 'ethereum'
      || chain.network === 'moloch'
      || chain.network === 'metacart'
    ) {
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
      const address = ethUtil.bufferToHex(addressBuffer);
      isValid = (addressModel.address.toLowerCase() === address.toLowerCase());
    } else if (chain.network === 'near') {
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
  };

  return Address;
};

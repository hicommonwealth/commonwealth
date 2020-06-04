(global as any).window = {};

import crypto from 'crypto';
import { ADDRESS_TOKEN_EXPIRES_IN } from '../config';

import Keyring, { decodeAddress } from '@polkadot/keyring';
import { stringToU8a, hexToU8a, u8aToString } from '@polkadot/util';
import ExtrinsicPayload from '@polkadot/types/extrinsic/v4/ExtrinsicPayload';
import { TypeRegistry } from '@polkadot/types';

import * as secp256k1 from 'secp256k1';
import * as CryptoJS from 'crypto-js';

import { getCosmosAddress } from '@lunie/cosmos-keys';
import nacl from 'tweetnacl';
import { KeyringOptions } from '@polkadot/keyring/types';
import { keyToSignMsg } from '../../shared/adapters/chain/cosmos/keys';
import { NotificationCategories } from '../../shared/types';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

// tslint:disable-next-line
const ethUtil = require('ethereumjs-util');

module.exports = (sequelize, DataTypes) => {
  const Address = sequelize.define('Address', {
    address:                    { type: DataTypes.STRING, allowNull: false },
    chain:                      { type: DataTypes.STRING, allowNull: false },
    selected:                   { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    verification_token:         { type: DataTypes.STRING, allowNull: false },
    verification_token_expires: { type: DataTypes.DATE, allowNull: true },
    verified:                   { type: DataTypes.DATE, allowNull: true },
    keytype:                    { type: DataTypes.STRING, allowNull: true },
    name:                       { type: DataTypes.STRING, allowNull: true }
  }, {
    underscored: true,
    indexes: [
      { fields: ['address', 'chain'], unique: true },
      { fields: ['user_id'] },
      { fields: ['name'] }
    ],
  });

  Address.associate = (models) => {
    models.Address.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
    models.Address.belongsTo(models.User, { foreignKey: 'user_id', targetKey: 'id' });
    models.Address.hasOne(models.OffchainProfile);
    models.Address.hasMany(models.Role, { foreignKey: 'address_id', targetKey: 'id' });
  };

  // Create an unverified 'stub' address, with a verification token
  // tslint:disable:variable-name
  Address.createWithToken = (user_id, chain, address, keytype?) => {
    const verification_token = crypto.randomBytes(18).toString('hex');
    const verification_token_expires = new Date(+(new Date()) + ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000);
    return Address.create({ user_id, chain, address, verification_token, verification_token_expires, keytype });
  };

  // Update an existing address' verification token
  Address.updateWithToken = (address, user_id?, keytype?) => {
    const verification_token = crypto.randomBytes(18).toString('hex');
    const verification_token_expires = new Date(+(new Date()) + ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000);
    if (user_id) {
      address.user_id = user_id;
    }
    address.keytype = keytype;
    address.verification_token = verification_token;
    address.verification_token_expires = verification_token_expires;
    return address.save();
  };

  // Verify an address' verification token. Requires some data to be
  // passed from the frontend to show exactly what was signed.
  // Supports Substrate, Ethereum, Cosmos, and NEAR.
  Address.verifySignature = async (
    models,
    chain,
    addressModel,
    user_id,
    signatureString: string,
    signatureParams: string,
  ) => {
    if (!chain) {
      log.error('no chain provided to verifySignature');
      return false;
    }

    let isValid;
    if (chain.network === 'edgeware' || chain.network === 'kusama') {
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
      } else {
        keyringOptions.ss58Format = 42; // default chain id
      }
      const signerKeyring = new Keyring(keyringOptions).addFromAddress(address);
      if (signatureParams) {
        let params;
        try {
          params = JSON.parse(signatureParams);
          const verificationToken = u8aToString(hexToU8a(params.method));
          const verificationTokenValid = verificationToken.indexOf(addressModel.verification_token) !== -1;
          if (!verificationTokenValid) return false;
        } catch (e) {
          log.error('Invalid signatureParams');
          return false;
        }
        const signedPayload = new ExtrinsicPayload(new TypeRegistry(), params).toU8a(true);
        isValid = signerKeyring.verify(signedPayload, hexToU8a(signatureString));
      } else {
        const signedMessage = stringToU8a(addressModel.verification_token + '\n');
        isValid = signerKeyring.verify(signedMessage, hexToU8a('0x' + signatureString));
      }
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
      isValid = (addressModel.address.toLowerCase() === address.toLowerCase()) ? true : false ;
    } else if (chain.network === 'near') {
      // both in base64 encoding
      const { signature: sigObj, publicKey } = JSON.parse(signatureString);
      isValid = nacl.sign.detached.verify(
        Buffer.from(addressModel.verification_token + '\n'),
        Buffer.from(sigObj, 'base64'),
        Buffer.from(publicKey, 'base64'),
      );
    } else {
      // invalid network
      log.error('invalid network: ' + chain.network);
      isValid = false;
    }

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
      await addressModel.save();
    } else if (isValid) {
      // mark the address as verified
      addressModel.verification_token_expires = null;
      addressModel.verified = new Date();
      addressModel.user_id = user_id;
      await addressModel.save();
    }
    return isValid;
  };

  return Address;
};

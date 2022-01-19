import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';
import { DynamicTemplate, ChainBase } from '../../shared/types';
import AddressSwapper from '../util/addressSwapper';
import { AppError, ServerError } from '../util/errors';
import { ChainInstance } from '../models/chain';
import { AXIE_SHARED_SECRET } from '../config';

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
};

const processAddress = async (
  models: DB,
  chain: ChainInstance,
  address: string,
  signature?: string,
  user?: Express.User
): Promise<void> => {
  const existingAddress = await models.Address.scope('withPrivateData').findOne({
    where: { chain: chain.id, address }
  });
  if (!existingAddress) {
    throw new AppError(Errors.AddressNF);
  }

  // first, check whether the token has expired
  // (certain login methods e.g. jwt have no expiration token, so we skip the check in that case)
  const expiration = existingAddress.verification_token_expires;
  if (expiration && +expiration <= +(new Date())) {
    throw new AppError(Errors.ExpiredToken);
  }
  // check for validity
  const isAddressTransfer = !!existingAddress.verified && user && existingAddress.user_id !== user.id;
  const oldId = existingAddress.user_id;
  try {
    const valid = await models.Address.verifySignature(
      models, chain, existingAddress, (user ? user.id : null), signature
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
      const oldUser = await models.User.scope('withPrivateData').findOne({ where: { id: oldId } });
      if (!oldUser) {
        // users who register thru github don't have emails by default
        throw new Error(Errors.NoEmail);
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
      log.info(`Sent address move email: ${address} transferred to a new account`);
    } catch (e) {
      log.error(`Could not send address move email for: ${address}`);
    }
  }
};

const verifyWithSignature = async (
  models: DB,
  chain: ChainInstance,
  address: string,
  signature: string,
  user?: Express.User
): Promise<string> => {
  const encodedAddress = chain.base === ChainBase.Substrate
    ? AddressSwapper({ address, currentPrefix: chain.ss58_prefix })
    : address;
  await processAddress(models, chain, encodedAddress, signature, user);
  return encodedAddress;
};

const verifyWithToken = async (
  models: DB,
  chain: ChainInstance,
  token: string,
  user?: Express.User
): Promise<string> => {
  // TODO: make this more flexible
  // decode token using secret
  if (!AXIE_SHARED_SECRET) {
    throw new ServerError(Errors.BadSecret)
  }

  // verify token and get address
  let address: string;
  try {
    // TODO: correct options
    const decoded = jwt.verify(token, AXIE_SHARED_SECRET, { issuer: 'AxieInfinity' });

    // token must be object
    if (typeof decoded === 'string') {
      throw new Error('Token must be object');
    }
    const { roninAddress } = decoded as { roninAddress: string };
    address = roninAddress;
  } catch (e) {
    log.info(`Axie token decoding error: ${e.message}`);
    throw new AppError(Errors.BadToken);
  }
  await processAddress(models, chain, address, null, user);
  return address;
};

const verifyAddress = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  if (!req.body.chain) {
    throw new AppError(Errors.NoChain);
  }
  const chain = await models.Chain.findOne({
    where: { id: req.body.chain }
  });
  if (!chain) {
    return next(new Error(Errors.InvalidChain));
  }

  let address: string;
  if (req.body.token) {
    address = await verifyWithToken(models, chain, req.body.token, req.user);
  } else if (req.body.address && req.body.signature) {
    address = await verifyWithSignature(models, chain, req.body.address, req.body.signature, req.user);
  } else {
    throw new AppError(Errors.InvalidArguments);
  }

  if (req.user) {
    // if user was already logged in, we're done
    return res.json({ status: 'Success', result: { address, message: 'Verified signature' } });
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
      return res.json({
        status: 'Success',
        result: {
          user,
          address,
          message: 'Logged in',
        }
      });
    });
  }
};

export default verifyAddress;

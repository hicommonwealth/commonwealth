import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { DynamicTemplate } from '../../shared/types';
const sgMail = require('@sendgrid/mail');
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoAddress: 'Must provide address',
  NoChain: 'Must provide chain',
  NoSignature: 'Must provide signature',
  AddressNF: 'Address not found',
  ExpiredToken: 'Token has expired, please re-register',
  InvalidSignature: 'Invalid signature, please re-register',
  NoEmail: 'No email to alert',
};

const verifyAddress = async (models, req: Request, res: Response, next: NextFunction) => {
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
    where: { id: req.body.chain }
  });

  const existingAddress = await models.Address.findOne({
    where: { chain: req.body.chain, address: req.body.address }
  });
  if (!existingAddress) {
    return next(new Error(Errors.AddressNF));
  } else {
    // first, check whether the token has expired
    const expiration = existingAddress.verification_token_expires;
    if (expiration && +expiration <= +(new Date())) {
      return next(new Error(Errors.ExpiredToken));
    }
    // check for validity
    const isAddressTransfer = !!existingAddress.verified && req.user && existingAddress.user_id !== req.user.id;
    const oldId = existingAddress.user_id;
    try {
      const valid = await models.Address.verifySignature(
        models, chain, existingAddress, (req.user ? req.user.id : null), req.body.signature
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
        const user = await models.User.findOne({ where: { id: oldId } });
        if (!user.email) throw new Error(Errors.NoEmail); // users who register thru github don't have emails by default!
        const msg = {
          to: user.email,
          from: 'Commonwealth <no-reply@commonwealth.im>',
          templateId: DynamicTemplate.VerifyAddress,
          dynamic_template_data: {
            address: req.body.address,
            chain: req.body.chain,
          },
        };
        await sgMail.send(msg);
        log.info('sent address move email!');
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
        where: { chain: req.body.chain, address: req.body.address },
      });
      const user = await models.User.findOne({
        where: { id: newAddress.user_id },
      });
      req.login(user, (err) => {
        if (err) return next(err);
        return res.json({
          status: 'Success',
          result: {
            user,
            message: 'Logged in',
          }
        });
      });
    }
  }
};

export default verifyAddress;

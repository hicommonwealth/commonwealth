import sgMail from '@sendgrid/mail';
import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';
import { factory, formatFilename } from '../util/logging';
const log = factory.getLogger(formatFilename(__filename));

const verifyAddress = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  // Verify that a linked address is actually owned by its supposed user.
  //
  // We accept `signature` if the user is capable of directly signing
  // bytes, or `txSignature` and `txParams` if the user can't sign
  // bytes but can sign a no-op tx like Substrate's system.remark().

  if (!req.body.address) {
    return next(new Error('Must provide address'));
  }
  if (!req.body.chain) {
    return next(new Error('Must provide chain'));
  }
  if (!req.body.signature && !(req.body.txSignature && req.body.txParams)) {
    return next(new Error('Must provide signature'));
  }
  const chain = await models.Chain.findOne({
    where: { id: req.body.chain }
  });

  const existingAddress = await models.Address.findOne({
    where: { chain: req.body.chain, address: req.body.address }
  });
  if (!existingAddress) {
    return next(new Error('Address not found'));
  } else {
    // first, check whether the token has expired
    const expiration = existingAddress.verification_token_expires;
    if (expiration && +expiration <= +(new Date())) {
      return next(new Error('Token has expired, please re-register'));
    }
    // check for validity
    const isAddressTransfer = existingAddress.verified && req.user && existingAddress.user_id !== req.user.id;
    const oldId = existingAddress.user_id;
    try {
      const valid = req.body.signature
        ? await models.Address.verifySignature(
          models, chain, existingAddress, (req.user ? req.user.id : null), req.body.signature
        )
        : await models.Address.verifySignature(
          models, chain, existingAddress, (req.user ? req.user.id : null), req.body.txSignature, req.body.txParams
        );
      if (!valid) {
        return next(new Error('Invalid signature, please re-register'));
      }
    } catch (e) {
      return next(e);
    }

    // if someone else already verified it, send an email letting them know ownership
    // has been transferred to someone else
    if (isAddressTransfer) {
      try {
        const user = await models.User.findOne({ where: { id: oldId } });
        if (!user.email) throw new Error('No email to alert'); // users who register thru github don't have emails!
        const mainText = `Another user signed a message using ${req.body.address} `
          + `(${req.body.chain}) claiming the address as their own.`;
        const secondLine = 'If this was you, you don\'t need to do anything.';
        const thirdLine = 'If this was someone else, you should stop using the address immediately, '
          + 'and take steps to protect any funds, identities, or voting power linked to it.';
        const msg = {
          to: user.email,
          from: 'Commonwealth <no-reply@commonwealth.im>',
          subject: 'Your address was moved',
          text: `${mainText}\n\n${secondLine}\n\n${thirdLine}`,
          html: `${mainText}<br/><br/>${secondLine}<br/><br/>${thirdLine}`,
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

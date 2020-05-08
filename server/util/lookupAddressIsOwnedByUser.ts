// Helper function to look up an (address, author_chain) pair of parameters,
// and check that it's owned by the current user. Only for POST requests.

import { Request, NextFunction } from 'express';

const lookupAddressIsOwnedByUser = async (models, req: Request, next: NextFunction) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
  }

  if (!req.body.author_chain || !req.body.address) {
    return next(new Error('Invalid public key/chain'));
  }

  const author = await models.Address.findOne({ where: {
    chain: req.body.author_chain,
    address: req.body.address,
    user_id: req.user.id,
  } });
  if (!author || !author.verified || author.user_id !== req.user.id) {
    return next(new Error('Invalid public key/chain'));
  }
  return author;
};

export default lookupAddressIsOwnedByUser;

// Helper function to look up an (address, author_chain) pair of parameters,
// and check that it's owned by the current user. Only for POST requests.

import { Request } from 'express';

const lookupAddressIsOwnedByUser = async (models, req: Request) => {
  if (!req.user) {
    return 'Not logged in';
  }

  if (!req.body.author_chain || !req.body.address) {
    return 'Invalid public key/chain';
  }

  const author = await models.Address.findOne({ where: {
    chain: req.body.author_chain,
    address: req.body.address,
    user_id: req.user.id,
  } });
  if (!author || !author.verified || author.user_id !== req.user.id) {
    return 'Invalid public key/chain';
  }
  return author;
};

export default lookupAddressIsOwnedByUser;

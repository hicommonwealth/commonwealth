// Helper function to look up an (address, author_chain) pair of parameters,
// and check that it's owned by the current user. Only for POST requests.

import { DB } from '../database';
import { AddressInstance } from '../models/address';
import { UserInstance } from '../models/user';

type AddressChainReq = { body?: { author_chain: string, address: string }, user?: UserInstance };

const lookupAddressIsOwnedByUser = async (
  models: DB,
  req: AddressChainReq
): Promise<[AddressInstance | null, string | null]> => {
  if (!req.user?.id) {
    return [null, 'Not logged in'];
  }

  if (!req.body?.author_chain || !req.body?.address) {
    return [null, 'Invalid public key/chain'];
  }

  const author = await models.Address.findOne({ where: {
    chain: req.body.author_chain,
    address: req.body.address,
    user_id: req.user.id,
  } });
  if (!author || !author.verified || author.user_id !== req.user.id) {
    return [null, 'Invalid public key/chain'];
  }
  return [author, null];
};

export default lookupAddressIsOwnedByUser;

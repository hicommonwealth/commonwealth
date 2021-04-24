import moment from 'moment';
import { Request, Response, NextFunction } from 'express';

import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';

export const Errors = {
};

const updateOffchainVote = async (models, req: Request, res: Response, next: NextFunction) => {
  const [chain, community, error] = await lookupCommunityIsVisibleToUser(models, req.body, req.user);
  if (error) return next(new Error(error));
  const [author, authorError] = await lookupAddressIsOwnedByUser(models, req);
  if (authorError) return next(new Error(authorError));

  // TODO: check that req.thread_id is valid, and increment offchain_voting_offchain_votes on the thread
  // TODO: check that req.option is valid, and import options from shared/types
  // TODO: check and validate req.signature, instead of checking for author

  let vote = await models.OffchainVote.findOne({
    where: {
      thread_id: req.body.thread_id,
      address: req.body.address,
      chain: req.body.chain,
    }
  });

  if (!vote) {
    vote = await models.OffchainVote.create({
      thread_id: req.body.thread_id,
      address: req.body.address,
      chain: req.body.chain,
      option: req.body.option,
    });
  } else {
    vote.option = req.body.option;
    await vote.save();
  }

  return res.json({ status: 'Success', result: vote.toJSON() });
};

export default updateOffchainVote;

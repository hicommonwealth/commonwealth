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

  // TODO: check that req.thread_id is valid
  // TODO: check that req.choice is valid
  // TODO: check and validate req.signature

  let vote = await models.OffchainVote.findOne({
    where: {
      thread_id: req.thread_id,
      address: req.address,
      chain: req.chain,
      community: req.community,
    }
  });

  if (!vote) {
    vote = await models.OffchainVote.create({
      thread_id: req.thread_id,
      address: req.address,
      chain: req.chain,
      community: req.community,
      choice: req.choice,
    });
  } else {
    vote.choice = req.choice;
    await vote.save();
  }

  return res.json({ status: 'Success', result: vote.toJSON() });
};

export default updateOffchainVote;

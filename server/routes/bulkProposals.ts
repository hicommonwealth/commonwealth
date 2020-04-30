import moment from 'moment';
import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';
import { factory, formatFilename } from '../util/logging';
const log = factory.getLogger(formatFilename(__filename));

const bulkProposals = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  const findOptions: any = {
    include: [ ],
    order: [['created_at', 'DESC']],
    where: { }
  };
  if (req.query.complete !== undefined) {
    findOptions.where.complete = req.query.complete;
  }
  if (req.query.type) {
    findOptions.where.chain = req.query.type;
  }
  if (req.query.after) {
    findOptions.where.created_at = { $gt: moment(req.query.after).toDate() };
  }
  if (req.query.chain) {
    const chain = await models.Chain.findOne({
      where: { id: req.query.chain }
    });
    if (!chain) {
      return next(new Error('Invalid chain'));
    }
    findOptions.where.chain = req.query.chain;
  }
  if (req.query.identifier !== undefined) {
    if (!req.query.type) {
      return next(new Error('Cannot provide identifier without type.'));
    }
    findOptions.where.identifier = req.query.identifier;
  }
  const proposals = await models.Proposal.findAll(findOptions);

  return res.json({ status: 'Success', result: proposals.map((p) => p.toJSON()) });
};

export default bulkProposals;

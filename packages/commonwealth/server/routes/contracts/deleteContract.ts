import { Request, Response, NextFunction } from 'express';
import { QueryTypes } from 'sequelize';
import { factory, formatFilename } from 'common-common/src/logging';
import { DB } from '../../database';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NotAdmin: 'Must be admin',
  NeedChainId: 'Must provide chain id',
  NoChain: 'Chain not found',
  CannotDeleteChain: 'Cannot delete a chain with registered addresses',
  NotAcceptableAdmin: 'Not an Acceptable Admin'
};

const deleteContract = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }
  if (!req.user.isAdmin) {
    return next(new Error(Errors.NotAdmin));
  }
  if (!req.body.id) {
    return next(new Error(Errors.NeedChainId));
  }
  if (!['george@commonwealth.im', 'zak@commonwealth.im', 'jake@commonwealth.im',
  'daniel@commonwealth.im',].includes(req.user.email)) {
    return next(new Error(Errors.NotAcceptableAdmin));
  }

  await models.sequelize.transaction(async (t) => {
    const contract = await models.Contract.findOne({
      where: {
        id: req.body.id,
      }
    });
    if (!contract) {
      return next(new Error(Errors.NoChain));
    }

    await models.sequelize.query(`DELETE FROM "Contracts" WHERE id='${contract.id}';`, {
      type: QueryTypes.DELETE,
      transaction: t,
    });
  });

  return res.json({ status: 'Success', result: 'Deleted contract' });
};

export default deleteContract;

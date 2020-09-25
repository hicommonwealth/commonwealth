/* eslint-disable guard-for-in */
import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';


const getValidatorDetail = async (models, req: Request, res: Response, next: NextFunction) => {
  console.log(req.query, 'query');
  let validators: any = [];
  let where: any = { state: req.query?.state ? req.query?.state : 'Active' };

  // serarch by name or address
  if (req.query?.validatorStashes?.length) {
    where.stash = { [Op.in]: req?.query?.validatorStashes };
  }
  validators = await models.Validator.findAll({
    where,
    include: {
      model: models.HistoricalValidatorStatistic,
      order: [['created_at', 'DESC']],
    }
  });

  validators = JSON.parse(JSON.stringify(validators));
  validators = validators.map((row) => {
    row = { ...row.HistoricalValidatorStatistic?.[0], ...row };
    delete row.HistoricalValidatorStatistic;
    return row;
  });

  return res.json({
    status: 'Success',
    count: validators.length,
    result: {
      validators
    }
  });
};

export default getValidatorDetail;

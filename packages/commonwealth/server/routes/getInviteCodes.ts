import { Response } from 'express';
import { query } from 'express-validator';
import { DB } from '../models';
import { TypedRequestQuery } from '../types';

export const getInviteCodesValidation = [
  query('chain_id').isString().trim(),
];

export const getInviteCodes = async (
  models: DB,
  req: TypedRequestQuery<{ chain_id: string }>,
  res: Response
) => {
  const inviteCodes = await models.InviteCode.findAll({ where: { chain_id: req.query.chain_id } });

  return res.json({
    inviteCodes
  });
};
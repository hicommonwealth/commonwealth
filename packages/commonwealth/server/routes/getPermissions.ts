import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import type { DB } from '../models';
import { Action } from 'commonwealth/shared/permissions';
import { isAddressPermitted } from '../util/roles';

export const Errors = {
  NeedChainId: 'Must provide a chain id to fetch',
  InvalidBody: 'Invalid Request Body',
  InvalidAction: 'Invalid Action sent in the request body',
  InvalidActionNumber: 'The Action number provided does not match the Action enum',
};

export const getHasPermissions = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if(!req.body){
    throw new AppError(Errors.InvalidBody);
  }

  const { action } = req.body;
  if (!action) {
    throw new AppError(Errors.InvalidAction);
  }

  const { chain } = req.chain;
  const { author } = req.address;

  //check if the action matched a value in the Action enum
  if (!Object.values(Action).includes(action)) {
    throw new AppError(Errors.InvalidActionNumber);
  }

  const permission_error = await isAddressPermitted(
    models,
    author.id,
    chain.id,
    action
  );





};

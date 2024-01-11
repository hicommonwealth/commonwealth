import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import type { DeleteReq, OnlyErrorResp } from '../api/extApiTypes';
import { filterAddressOwnedByUser } from '../middleware/lookupAddressIsOwnedByUser';
import type { DB } from '../models';
import type { ModelStatic } from '../models/types';
import type { TypedRequest, TypedResponse } from '../types';
import { failure, success } from '../types';

export const deleteEntities = async (
  chainIdFieldName: string,
  models: DB,
  model: ModelStatic<any>,
  req: TypedRequest<DeleteReq>,
  res: TypedResponse<OnlyErrorResp>,
) => {
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return failure(res.status(400), errors);
  }

  const where = { id: { [Op.in]: req.body.ids } };

  const entities = await model.findAll({ where });

  if (req.user) {
    const addresses = await filterAddressOwnedByUser(
      models,
      req.user.id,
      entities.map((e) => e[chainIdFieldName]),
      [],
      entities.map((e) => e.address_id),
    );

    if (addresses.unowned.length !== 0) {
      return failure(res, {
        error: {
          message: 'Some entities to delete were not owned by the user.',
          unownedAddresses: addresses.unowned,
        },
      });
    }
  }

  let error = '';
  try {
    await model.destroy({ where });
  } catch (e) {
    error = e.message;
  }
  return success(res, { error });
};

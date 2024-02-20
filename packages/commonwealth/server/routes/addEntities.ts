import type { DB } from '@hicommonwealth/model';
import { validationResult } from 'express-validator';
import type { OnlyErrorResp } from '../api/extApiTypes';
import { filterAddressOwnedByUser } from '../middleware/lookupAddressIsOwnedByUser';
import type { TypedRequest, TypedResponse } from '../types';
import { failure, success } from '../types';

export async function addEntities<
  M extends Record<string, unknown> = Record<string, unknown>,
>(
  models: DB,
  bulkCreate: (obj) => Promise<number>,
  entities: (req: TypedRequest<M>) => any,
  req: TypedRequest<M>,
  res: TypedResponse<OnlyErrorResp>,
) {
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return failure(res.status(400), errors);
  }

  const entityCopy = entities(req);

  let addressMap;
  if (req.user) {
    const addresses = await filterAddressOwnedByUser(
      models,
      req.user.id,
      entityCopy.map((e) => e.community_id),
      entityCopy.map((e) => e.address),
      entityCopy.map((e) => e.address_id),
    );

    if (addresses.unowned.length !== 0) {
      return failure(res, {
        error: {
          message: 'Some addresses provided were not owned by the user.',
          unownedAddresses: addresses.unowned,
        },
      });
    }

    addressMap = new Map(addresses.owned.map((obj) => [obj.address, obj.id]));
  }

  entityCopy.forEach((c) => {
    // all the entities use the address_id field. If user passed in address, map it to address_id
    if (addressMap && c.address) {
      c.address_id = addressMap.get(c.address);
      delete c['address'];
    }
  });

  let error = '';
  try {
    await bulkCreate(entityCopy);
  } catch (e) {
    error = e.name + JSON.stringify(e.fields);
  }
  return success(res, { error });
}

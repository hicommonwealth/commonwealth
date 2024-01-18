import { TypedRequest, TypedResponse } from 'server/types';
import type { DB } from '../models';

export const Errors = {};

type GetAddressStatusResponseBody = {
  exists: boolean;
  belongsToUser: boolean;
};

const getAddressStatus = async (
  models: DB,
  req: TypedRequest<any>,
  res: TypedResponse<GetAddressStatusResponseBody>,
) => {
  const { user, address } = req;

  let result: GetAddressStatusResponseBody = {
    exists: false,
    belongsToUser: false,
  };

  if (address) {
    const belongsToUser = user && address.user_id === user.id;
    result = {
      exists: true,
      belongsToUser,
    };
  }

  return res.json({ status: 'Success', result });
};

export default getAddressStatus;

import { body, validationResult } from 'express-validator';
import { PutCommunitiesReq, PutCommunitiesResp } from 'common-common/src/api/extApiTypes';
import { NextFunction } from 'express';
import { TokenBalanceCache } from 'token-balance-cache/src';
import { AppError } from 'common-common/src/errors';
import { DB } from '../../models';
import { failure, success, TypedRequest, TypedResponse } from '../../types';
import { createAddressHelper } from '../../util/createAddressHelper';
import { CreateAddressReq } from '../createAddress';
import { sequelize } from '../../database';

export const Errors = {
  NeedPositiveBalance: 'Must provide address with positive balance',
};

const optionalValidation = [
  body('contract.token_type').optional().isString().trim(),
  body('contract.address').optional().isString().trim(),
  body('admin_addresses').optional().isArray()
];

export const putCommunitiesValidation = [
  body('community.id').exists().isString().trim(),
  body('community.name').exists().isString().trim(),
  body('community.chain_node_id').exists().isString().trim(),
  body('community.created_at').not().exists(),
  body('community.updated_at').not().exists(),
  body('community.deleted_at').not().exists(),
  ...optionalValidation,
];

export async function putCommunities(
  models: DB,
  tbc: TokenBalanceCache,
  req: TypedRequest<PutCommunitiesReq>,
  res: TypedResponse<PutCommunitiesResp>,
  next: NextFunction
) {
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return failure(res.status(400), errors);
  }

  const { community, contract, admin_addresses } = req.body;

  const transaction = await sequelize.transaction();
  let error = '';
  try {
    await models.Chain.create(community);
    // if optionalValidation route is used, check for positive balance in address provided
    if (contract.token_type) {
      const [{ bp }] = await tbc.getBalanceProviders(community.chain_node_id);
      const balanceResults = await tbc.getBalancesForAddresses(community.chain_node_id, admin_addresses, bp, {
        contractType: contract.token_type,
        tokenAddress: contract.address,
      });

      let positiveBalance = false;
      for (const balance of Object.values(balanceResults.balances)) {
        if (balance !== '0') {
          positiveBalance = true;
          break;
        }
      }

      if (!positiveBalance) {
        throw new AppError(Errors.NeedPositiveBalance);
      }
    }

    // create address for each admin_address, and assign to admin role
    await Promise.all(admin_addresses.map(async (address) => {
      const r: CreateAddressReq = { address, chain: community.id, community: community.id, wallet_id: null };

      const newAddress = await createAddressHelper(r, models, req.user, next);
      await models.Role.update({ permission: 'admin' }, { where: { address_id: (newAddress as any).id } });
    }));

    transaction.commit();
  } catch (e) {
    error = e.message;
    await transaction.rollback();
  }

  const url = `https://commonwealth.im/${community.id}`;
  return success(res, { url, error });
}
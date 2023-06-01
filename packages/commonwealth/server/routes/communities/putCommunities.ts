import { body, validationResult } from 'express-validator';
import type {
  PutCommunitiesReq,
  PutCommunitiesResp,
} from 'common-common/src/api/extApiTypes';
import type { NextFunction } from 'express';
import type { TokenBalanceCache } from 'token-balance-cache/src';
import { AppError } from 'common-common/src/errors';
import type { DB } from '../../models';
import type { TypedRequest, TypedResponse } from '../../types';
import { failure, success } from '../../types';
import { createAddressHelper } from '../../util/createAddressHelper';
import type { CreateAddressReq } from '../createAddress';
import { sequelize } from '../../database';

export const Errors = {
  NeedPositiveBalance: 'Must provide address with positive balance',
  NeedToSpecifyContract:
    'Must provide admin_addresses, contract.token_type, and contarct.address',
};

const optionalValidation = [
  body('contract.token_type').optional().isString().trim(),
  body('contract.address').optional().isString().trim(),
  body('admin_addresses').optional().isArray(),
];

export const putCommunitiesValidation = [
  body('community.id').exists().isString().trim(),
  body('community.name').exists().isString().trim(),
  body('community.chain_node_id').exists().isNumeric(),
  body('community.default_symbol').exists().isString().trim(),
  body('community.network').exists().isString().trim(),
  body('community.type').exists().isString().trim(),
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
    if (contract) {
      if (!contract.token_type || !contract.address || !admin_addresses) {
        throw new AppError(Errors.NeedToSpecifyContract);
      }

      const [{ bp }] = await tbc.getBalanceProviders(community.chain_node_id);
      const balanceResults = await tbc.getBalancesForAddresses(
        community.chain_node_id,
        admin_addresses,
        bp,
        {
          contractType: contract.token_type,
          tokenAddress: contract.address,
        }
      );

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

      // create address for each admin_address, and assign to admin role
      await Promise.all(
        admin_addresses.map(async (address) => {
          const r: CreateAddressReq = {
            address,
            chain: community.id,
            community: community.id,
            wallet_id: null,
            wallet_sso_source: null,
          };

          const newAddress = await createAddressHelper(
            r,
            models,
            req.user,
            next
          );
          await models.Role.update(
            { permission: 'admin' },
            { where: { address_id: (newAddress as any).id } }
          );
        })
      );
    }

    await transaction.commit();
  } catch (e) {
    error = e.message;
    await transaction.rollback();
  }

  const url = `https://commonwealth.im/${community.id}`;
  return success(res, { url, error });
}

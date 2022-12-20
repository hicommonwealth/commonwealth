import { body, validationResult } from "express-validator";
import { PutCommunitiesReq, PutCommunitiesResp } from "common-common/src/api/extApiTypes";
import { DB } from "../../models";
import { failure, success, TypedRequest, TypedResponse } from "../../types";
import { createAddressHelper } from "../createAddress";
import { TokenBalanceCache } from 'token-balance-cache/src';

const optionalValidation = [
  body('token').optional().isString().trim(),
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
  res: TypedResponse<PutCommunitiesResp>
) {
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return failure(res.status(400), errors);
  }

  if (req.body.token) {
    tbc.getBalancesForAdAdresses(req.body.community.chain_node_id, req.body.admin_addresses, )
  }

  let error = '';
  let url = '';
  try {
    await models.Chain.create(req.body.community);
    url = `https://commonwealth.im/${req.body.community.id}`;

    createAddressHelper(models, req.body.community, ,)
  } catch (e) {
    error = e.message;
  }

  return success(res, { url, error });
}
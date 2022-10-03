import { AppError } from '../../util/errors';
import validateChain from '../../util/validateChain';
import { RuleAttributes } from '../../models/rule';
import { success, TypedRequestBody, TypedResponse } from '../../types';
import { DB } from '../../database';

const GetRulesError = {
  NoChain: 'No Chain specified',
  NoChainFound: 'Could not validate chain',
  RulesError: 'Could not find rules',
};
type getRulesReq = {
  chain_id: string;
};

type getRulesResp = {
  rules: Array<RuleAttributes>;
};

const getRules = async (
  models: DB,
  req: TypedRequestBody<getRulesReq>,
  res: TypedResponse<getRulesResp>
) => {
  const { chain_id } = req.body;
  console.log('res', req.body);

  // Check if chain exists
  if (!chain_id) throw new AppError(GetRulesError.NoChain);
  const [_, error] = await validateChain(models, { chain_id });

  if (error) throw new AppError(GetRulesError.NoChainFound);

  // Return all rules associated with that chain id
  let rules = [];
  try {
    rules = await models.Rule.findAll({ where: { chain_id } });
  } catch (e) {
    throw new AppError(GetRulesError.RulesError);
  }

  return success(res, { rules });
};

export default getRules;

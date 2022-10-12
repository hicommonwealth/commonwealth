import { success, TypedRequestQuery, TypedResponse } from '../../types';
import { DB } from '../../models';
import { RuleMetadata } from '../../util/rules/ruleTypes';
import RuleTypes from '../../ruleTypes';

type GetRuleTypesResp = { [name: string]: RuleMetadata };

const getRuleTypes = async (
  models: DB,
  req: TypedRequestQuery<Record<string, never>>,
  res: TypedResponse<GetRuleTypesResp>,
) => {
  const results: GetRuleTypesResp = {};
  for (const [ruleId, ruleObj] of Object.entries(RuleTypes)) {
    results[ruleId] = ruleObj.metadata;
  }
  return success(res, results);
};

export default getRuleTypes;

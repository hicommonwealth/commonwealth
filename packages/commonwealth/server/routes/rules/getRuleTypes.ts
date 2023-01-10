import type { TypedRequestQuery, TypedResponse } from '../../types';
import { success } from '../../types';
import type { DB } from '../../models';
import type { RuleMetadata } from '../../util/rules/ruleTypes';
import RuleTypes from '../../ruleTypes';

type GetRuleTypesResp = { [name: string]: RuleMetadata };

const getRuleTypes = async (
  models: DB,
  req: TypedRequestQuery<Record<string, never>>,
  res: TypedResponse<GetRuleTypesResp>
) => {
  const results: GetRuleTypesResp = {};
  for (const [ruleId, ruleObj] of Object.entries(RuleTypes)) {
    results[ruleId] = ruleObj.metadata;
  }
  return success(res, results);
};

export default getRuleTypes;

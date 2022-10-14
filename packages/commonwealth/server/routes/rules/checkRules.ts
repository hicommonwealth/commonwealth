import { success, TypedRequestBody, TypedResponse } from '../../types';
import { DB } from '../../models';
import RuleCache from '../../util/rules/ruleCache';
import { AppError } from '../../util/errors';
import checkRule from '../../util/rules/checkRule';

export const CheckRuleErrors = {
  NoRuleSpecified: 'No rule has been specified',
  NoRuleProvided: 'No rule provided',
  InvalidRule: 'Rule is not valid',
  AddressNotValid: 'Address is not valid',
};

type checkAddressAgainstRuleReq = {
  'rule_ids[]': number[];
  address: string;
};

type checkAddressAgainstRuleResp = {
  ruleChecks: { [rule_id: number]: boolean };
  validUnderAll: boolean;
};

const checkRules = async (
  models: DB,
  ruleCache: RuleCache,
  req: TypedRequestBody<checkAddressAgainstRuleReq>,
  resp: TypedResponse<checkAddressAgainstRuleResp>
) => {
  const { address } = req.body;
  const rule_ids = req.body['rule_ids[]'];
  if (!rule_ids) throw new AppError(CheckRuleErrors.NoRuleSpecified);

  try {
    await models.Address.findOne({ where: { address } });
  } catch (e) {
    throw new AppError(CheckRuleErrors.AddressNotValid);
  }

  let validUnderAll = true;
  const ruleChecks = {};
  for (const rule_id of rule_ids) {
    const isValid = await checkRule(ruleCache, models, rule_id, address);
    ruleChecks[rule_id] = isValid;
    if (!isValid) validUnderAll = false;
  }

  return success(resp, { ruleChecks, validUnderAll });
};

export default checkRules;

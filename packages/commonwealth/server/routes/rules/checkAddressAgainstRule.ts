import { success, TypedRequestBody, TypedResponse } from '../../types';
import { DB } from '../../database';
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
  rule_id: number;
  address: string;
};

type checkAddressAgainstRuleResp = { addressIsValidUnderRule: boolean };

const checkAddressAgainstRule = async (
  models: DB,
  ruleCache: RuleCache,
  req: TypedRequestBody<checkAddressAgainstRuleReq>,
  resp: TypedResponse<checkAddressAgainstRuleResp>
) => {
  const { rule_id, address } = req.body;
  if (!rule_id) throw new AppError(CheckRuleErrors.NoRuleSpecified);

  try {
    await models.Address.findOne({ where: { address } });
  } catch (e) {
    throw new AppError(CheckRuleErrors.AddressNotValid);
  }

  const isValid = await checkRule(ruleCache, models, rule_id, address);

  return success(resp, { addressIsValidUnderRule: isValid });
};

export default checkAddressAgainstRule;

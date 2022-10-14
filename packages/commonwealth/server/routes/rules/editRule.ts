import { DB } from '../../models';
import { AppError, ServerError } from '../../util/errors';
import { TypedResponse, success, TypedRequestBody } from '../../types';
import { validateRule } from '../../util/rules/ruleParser';
import validateRoles from '../../util/validateRoles';

export const EditRuleErrors = {
  NoRuleSpecified: 'No rule has been specified',
  NoRuleProvided: 'No rule provided',
  InvalidRule: 'Rule is not valid',
  AdminOnly: 'Only admin can edit rules',
};

type editRuleReq = {
  rule_id: string;
  chain_id: string;
  updated_rule: string;
};

type editRuleResp = {
  message: string;
};

const editRule = async (
  models: DB,
  req: TypedRequestBody<editRuleReq>,
  res: TypedResponse<editRuleResp>
) => {
  const isAdmin = await validateRoles(
    models,
    req.user,
    'admin',
    req.body.chain_id
  );
  if (!isAdmin) {
    throw new AppError(EditRuleErrors.AdminOnly);
  }

  const { rule_id, updated_rule, chain_id } = req.body;
  if (!rule_id) throw new AppError(EditRuleErrors.NoRuleSpecified);
  if (!updated_rule) throw new AppError(EditRuleErrors.NoRuleProvided);

  try {
    const existingRule = await models.Rule.findOne({
      where: { id: rule_id, chain_id },
    });
    if (!existingRule) throw new AppError(EditRuleErrors.InvalidRule);

    const santizedResult = validateRule(JSON.parse(updated_rule));
    existingRule.rule = santizedResult;

    await existingRule.save();

    return success(res, { message: 'Rule updated successfully' });
  } catch (e) {
    throw new AppError(EditRuleErrors.InvalidRule);
  }
};

export default editRule;

import { AppError, ServerError } from 'common-common/src/errors';
import { factory, formatFilename } from 'common-common/src/logging';

import type { DB } from '../../models';
import type { RuleAttributes } from '../../models/rule';
import type { TypedRequestBody, TypedResponse } from '../../types';
import { success } from '../../types';
import { validateRule } from '../../util/rules/ruleParser';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoRuleSpecified: 'No rule has been specified',
  InvalidRule: 'Rule is not valid',
};

type CreateRuleReq = { chain_id: string; rule: string };
type CreateRuleResp = RuleAttributes;

const createRule = async (
  models: DB,
  req: TypedRequestBody<CreateRuleReq>,
  res: TypedResponse<CreateRuleResp>
) => {
  // validate rule
  if (!req.body.rule) {
    throw new AppError(Errors.NoRuleSpecified);
  }
  let santizedResult;
  try {
    const ruleJson = JSON.parse(req.body.rule);
    santizedResult = validateRule(ruleJson);
  } catch (e) {
    log.info(`Failed to validate rule: ${e.message}`);
    throw new AppError(Errors.InvalidRule);
  }

  try {
    const ruleInstance = await models.Rule.create({
      chain_id: req.body.chain_id,
      rule: santizedResult,
    });
    return success(res, ruleInstance.toJSON());
  } catch (err) {
    throw new ServerError(err);
  }
};

export default createRule;

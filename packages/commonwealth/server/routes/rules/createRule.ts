import validateChain from '../../util/validateChain';
import { DB } from '../../models';
import { AppError, ServerError } from '../../util/errors';
import { TypedResponse, success, TypedRequestBody } from '../../types';
import { RuleAttributes } from '../../models/rule';

import { factory, formatFilename } from 'common-common/src/logging';
import { validateRule } from '../../util/rules/ruleParser';
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoRuleSpecified: 'No rule has been specified',
  InvalidRule: 'Rule is not valid',
};

type CreateRuleReq = { chain_id: string; rule: string; };
type CreateRuleResp = RuleAttributes;

const createRule = async (
  models: DB,
  req: TypedRequestBody<CreateRuleReq>,
  res: TypedResponse<CreateRuleResp>
) => {
  try {
    const [, error] = await validateChain(models, req.body);
    if (error) {
      throw new AppError(error);
    }
  } catch (err) {
    throw new AppError(err);
  }

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
    return success(
      res,
      ruleInstance.toJSON(),
    );
  } catch (err) {
    throw new ServerError(err);
  }
};

export default createRule;

import { Transaction } from 'sequelize';

import type { RuleType, DefaultSchemaT } from './ruleTypes'
import RuleTypes from '../../ruleTypes';
import RuleCache from './ruleCache';
import { DB } from '../../models';

export default async function checkRule(
  ruleCache: RuleCache,
  models: DB,
  ruleFk: number,
  address: string,
  transaction?: Transaction,
): Promise<boolean> {
  // always pass non-configured rules
  if (!ruleFk) return true;

  // check cache and return early if valid
  if (await ruleCache.check(ruleFk, address)) return true;

  // fetch the rule from the database by id
  const ruleInstance = await models.Rule.findOne({ where: { id: ruleFk } });
  if (!ruleInstance) return true;
  const ruleJson = ruleInstance.rule as Record<string, DefaultSchemaT>;

  // parse and run the rule according to its type
  const [[ruleId, ruleSchema]] = Object.entries(ruleJson);
  const ruleDef: RuleType = RuleTypes[ruleId];
  const isValid = await ruleDef.check(ruleSchema, address, ruleInstance.chain_id, models, transaction);

  // add new successes to cache
  if (isValid) await ruleCache.add(ruleFk, address);
  return isValid;
}

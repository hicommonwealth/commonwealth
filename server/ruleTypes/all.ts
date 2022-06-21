import { Transaction } from 'sequelize/types';
import { DB } from '../database';
import { RuleType, RuleArgumentType, DefaultSchemaT } from '../util/rules/ruleTypes';
import RuleTypes from './index';

type SchemaT = { AllRule: [ Array<Record<string, DefaultSchemaT>> ] };

export default class AllRule extends RuleType<SchemaT> {
  public readonly identifier = 'AllRule';
  public readonly metadata = {
    name: 'All Rule',
    description: 'Passes if all of the provided rules pass',
    arguments: [{
      name: 'Rules',
      description: 'Rules to check',
      type: 'rule[]' as RuleArgumentType,
    }],
  }

  public async check(
    ruleSchema: SchemaT,
    address: string,
    chain: string,
    models: DB,
    transaction: Transaction,
  ): Promise<boolean> {
    const rules = ruleSchema.AllRule[0];
    for (const subRule of rules) {
      const [subRuleId] = Object.keys(subRule);
      const subRuleDefn = subRule[subRuleId];
      const subRuleObj = RuleTypes[subRuleId];

      // TODO: permit caching of sub-rules
      const isValid = await subRuleObj.check(subRuleDefn, address, chain, models, transaction);
      if (!isValid) return false;
    }
    return true;
  }
}

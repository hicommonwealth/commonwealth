import type { Transaction } from 'sequelize/types';
import type { DefaultSchemaT, RuleArgumentType } from '../util/rules/ruleTypes';
import { RuleType } from '../util/rules/ruleTypes';
import RuleTypes from './index';
import type { DB } from '../models';

type SchemaT = { AnyRule: [Array<DefaultSchemaT>] };

export default class AnyRule extends RuleType<SchemaT> {
  public readonly identifier = 'AnyRule';
  public readonly metadata = {
    name: 'Any Rule',
    description: 'Passes if any of the provided rules pass',
    arguments: [
      {
        name: 'Rules',
        description: 'Rules to check',
        type: 'rule[]' as RuleArgumentType,
      },
    ],
  };

  public async check(
    ruleSchema: SchemaT,
    address: string,
    chain: string,
    models: DB,
    transaction?: Transaction
  ): Promise<boolean> {
    const rules = ruleSchema.AnyRule[0];
    for (const subRule of rules) {
      const [subRuleId] = Object.keys(subRule);
      const subRuleObj = RuleTypes[subRuleId];

      // TODO: permit caching of sub-rules
      const isValid = await subRuleObj.check(
        subRule,
        address,
        chain,
        models,
        transaction
      );
      if (isValid) return true;
    }
    return false;
  }
}

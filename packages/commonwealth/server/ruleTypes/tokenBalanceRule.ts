import { Transaction } from 'sequelize/types';
import { DB } from '../models';
import {
  RuleType,
  RuleArgumentType,
  DefaultSchemaT,
} from '../util/rules/ruleTypes';

type SchemaT = { TokenBalanceRule: [string, string] };

export default class TokenBalanceRule extends RuleType<SchemaT> {
  public readonly identifier = 'TokenBalanceRule';
  public readonly metadata = {
    name: 'Token Balance Rule',
    description: 'Passes if all the token balance passes',
    arguments: [
      {
        name: 'Token Contract',
        description: 'Token Contract',
        type: 'address' as RuleArgumentType,
      },
      {
        name: 'Token Threshold',
        description: 'Token Threshold',
        type: 'balance' as RuleArgumentType,
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
    // Not a real rule, just for testing the UI
    return true;
  }
}

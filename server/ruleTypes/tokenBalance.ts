import { Transaction } from 'sequelize/types';
import { RuleType, RuleArgumentType } from '../util/rules/ruleTypes';
import { DB } from '../database';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

type SchemaT = { TokenBalanceRule: [ number, string, string ] };

export default class TokenBalanceRule extends RuleType<SchemaT> {
  public readonly identifier = 'TokenBalanceRule';
  public readonly metadata = {
    name: 'Token Balance Rule',
    description: 'Only permit if actor has a specified amount of token',
    arguments: [
      {
        name: 'Chain Node ID',
        description: 'ID of topic to gate',
        type: 'number' as RuleArgumentType,
      },
      {
        name: 'Contract address',
        description: 'Address of contract',
        type: 'address' as RuleArgumentType,
        optional: true,
      },
      {
        name: 'Token threshold',
        description: 'Amount of tokens to require',
        type: 'balance' as RuleArgumentType,
      },
    ],
  }

  public async check(
    ruleSchema: SchemaT,
    address: string,
    chain: string,
    models: DB,
    transaction?: Transaction,
  ): Promise<boolean> {
    // TODO
    return false;
  }
}

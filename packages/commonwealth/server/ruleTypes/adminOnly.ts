import type { Transaction } from 'sequelize/types';
import type { DB } from '../models';
import { RuleType } from '../util/rules/ruleTypes';

type SchemaT = { AdminOnlyRule: [] };

export default class AdminOnlyRule extends RuleType<SchemaT> {
  public readonly identifier = 'AdminOnlyRule';
  public readonly metadata = {
    name: 'Admin Only Rule',
    description: 'Only admins can perform the gated action',
    arguments: [],
  };

  public async check(
    ruleSchema: SchemaT,
    address: string,
    chain: string,
    models: DB,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    transaction?: Transaction
  ): Promise<boolean> {
    const addressInstance = await models.Address.findOne({
      where: { address, chain },
      attributes: ['role'],
    });
    return addressInstance?.role === 'admin';
  }
}

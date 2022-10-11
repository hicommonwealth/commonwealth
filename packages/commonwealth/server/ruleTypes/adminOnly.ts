import { Transaction } from 'sequelize/types';
import { RuleType } from '../util/rules/ruleTypes';
import { DB } from '../database';
import { findOneRole } from '../util/roles';

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
    transaction?: Transaction
  ): Promise<boolean> {
    const role = await findOneRole(
      models,
      {
        include: { model: models.Address, where: { address }, required: true },
      },
      chain
    );
    return role?.permission === 'admin';
  }
}

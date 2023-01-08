import type { Transaction } from 'sequelize/types';
import { RuleType } from '../util/rules/ruleTypes';
import { findOneRole } from '../util/roles';
import type { DB } from '../models';

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
    const addressInstance = await models.Address.findOne({
      where: { address, chain },
    });
    const role = await findOneRole(
      models,
      {
        where: { address_id: addressInstance.id },
      },
      chain
    );
    return role?.permission === 'admin';
  }
}

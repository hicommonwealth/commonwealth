import { DB } from '../database';
import { RuleType } from '../util/ruleParser';

type SchemaT = { AdminOnlyRule: [] };

export default class AdminOnlyRule extends RuleType<SchemaT> {
  public readonly identifier = 'AdminOnlyRule';
  public readonly metadata = {
    name: 'Admin Only Rule',
    description: 'Only admins can perform the gated action',
    arguments: [],
  }

  public async check(
    ruleSchema: SchemaT,
    address: string,
    chain: string,
    models: DB
  ): Promise<boolean> {
    const role = await models.Role.findOne({
      where: {
        chain_id: chain,
      },
      include: {
        model: models.Address,
        where: { address },
        required: true,
      }
    });
    return role?.permission === 'admin';
  }
}

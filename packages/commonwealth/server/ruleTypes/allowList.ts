import { RuleType, RuleArgumentType } from '../util/rules/ruleTypes';

type SchemaT = { AllowListRule: [ string[] ] };

export default class AllowListRule extends RuleType<SchemaT> {
  public readonly identifier = 'AllowListRule';
  public readonly metadata = {
    name: 'Allow List Rule',
    description: 'Only a specified list of addresses can perform action',
    // TODO: add argument for address type?
    arguments: [{
      name: 'Allow List',
      description: 'Permitted addresses',
      type: 'address[]' as RuleArgumentType,
    }],
  }

  public async check(
    ruleSchema: SchemaT,
    address: string,
  ): Promise<boolean> {
    return ruleSchema.AllowListRule[0].includes(address);
  }
}

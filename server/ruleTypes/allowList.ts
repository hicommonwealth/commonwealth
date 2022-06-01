import { RuleType, RuleArgumentType } from '../util/ruleParser';

type SchemaT = { AllowListRule: [ string[] ] };

export default class AllowListRule implements RuleType<SchemaT> {
  public readonly identifier = 'AllowListRule';
  public readonly metadata = {
    name: 'Allow List Rule',
    description: 'Only a specified list of addresses can perform action',
    arguments: [{
      name: 'Allow List',
      description: 'Permitted addresses',
      type: 'address[]' as RuleArgumentType,
    }],
  }

  public validateRule(ruleSchema: SchemaT): SchemaT {
    if (!ruleSchema?.AllowListRule) throw new Error('Invalid identifier');
    if (!Array.isArray(ruleSchema.AllowListRule[0]) || ruleSchema.AllowListRule[0].length === 0) {
      throw new Error('Invalid allow list');
    }
    return { AllowListRule: [ ruleSchema.AllowListRule[0] ] };
  }

  public async check(
    ruleSchema: SchemaT,
    address: string,
  ): Promise<boolean> {
    return ruleSchema.AllowListRule[0].includes(address);
  }
}

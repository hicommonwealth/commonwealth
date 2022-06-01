import RuleTypes from '../ruleTypes';
import { DB } from '../database';

// acceptable types for rule arguments, verified in parser
export type RuleArgumentType = 'balance' | 'balance[]' | 'address' | 'address[]';

// provided typescript definitions for use in the rules folder
export type RuleMetadata = {
  name: string;
  description: string;
  arguments: Array<{ name: string, description: string, type: RuleArgumentType }>;
};

type DefaultSchemaT = Record<string, unknown>;

export abstract class RuleType<SchemaT extends DefaultSchemaT = DefaultSchemaT> {
  // parser-used identifier for a rule, e.g. "ThresholdRule"
  abstract get identifier(): string;

  // ui-used metadata for displaying a rule type
  abstract get metadata(): RuleMetadata;

  // check run at rule creation to validate that it was written properly
  abstract validateRule(ruleSchema: SchemaT): SchemaT;

  // check that the provided arguments pass the rule (i.e. do balance check)
  abstract check(ruleSchema: SchemaT, address: string, chain: string, models?: DB): Promise<boolean>;
}

export async function checkRule(
  models: DB,
  rule: Record<string, DefaultSchemaT>,
  address: string,
  chain: string,
): Promise<boolean> {
  const [[ruleId, ruleSchema]] = Object.entries(rule);
  const ruleDef: RuleType = RuleTypes[ruleId];
  const isValid = await ruleDef.check(ruleSchema, address, chain, models);
  return isValid;
}

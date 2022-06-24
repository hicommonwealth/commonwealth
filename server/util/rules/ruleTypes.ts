import { Transaction } from 'sequelize/types';
import { DB } from '../../database';

// acceptable types for rule arguments, verified in parser
export type RuleArgumentType = 'balance' | 'balance[]' | 'address' | 'address[]' | 'rule[]';

// provided typescript definitions for use in the rules folder
export type RuleMetadata = {
  name: string;
  description: string;
  arguments: Array<{ name: string, description: string, type: RuleArgumentType }>;
};

export type DefaultSchemaT = Record<string, Array<unknown>>;

// the type that must be implemented by a RuleType
export type IRuleType<SchemaT extends DefaultSchemaT> = {
  identifier: string,
  metadata: RuleMetadata,
  check: (
    ruleSchema: SchemaT,
    address: string,
    chain: string,
    models?: DB,
    transaction?: Transaction,
  ) => Promise<boolean>,
};

export abstract class RuleType<SchemaT extends DefaultSchemaT = DefaultSchemaT> implements IRuleType<SchemaT> {
  // parser-used identifier for a rule, e.g. "ThresholdRule"
  abstract get identifier(): string;

  // ui-used metadata for displaying a rule type
  abstract get metadata(): RuleMetadata;

  // check that the provided arguments pass the rule (i.e. do balance check)
  public abstract check(
    ruleSchema: SchemaT,
    address: string,
    chain: string,
    models?: DB,
    transaction?: Transaction,
  ): Promise<boolean>;
}

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

type DefaultSchemaT = Record<string, Array<unknown>>;

// the type that must be implemented by a RuleType
export type IRuleType<SchemaT extends DefaultSchemaT> = {
  identifier: string,
  metadata: RuleMetadata,
  check: (ruleSchema: SchemaT, address: string, chain: string, models?: DB) => Promise<boolean>,
};

export abstract class RuleType<SchemaT extends DefaultSchemaT = DefaultSchemaT> implements IRuleType<SchemaT> {
  // parser-used identifier for a rule, e.g. "ThresholdRule"
  abstract get identifier(): string;

  // ui-used metadata for displaying a rule type
  abstract get metadata(): RuleMetadata;

  private _validateArg(type: RuleArgumentType, arg: unknown): void {
    switch (type) {
      case 'balance[]': {
        if (!Array.isArray(arg)) {
          throw new Error('Argument must be array');
        }
        arg.forEach((balanceArg) => this._validateArg('balance', balanceArg));
        break;
      }
      case 'balance': {
        if (typeof arg !== 'string') throw new Error('Balance must be string');
        const isNumeric = /^\d+$/.test(arg);
        if (!isNumeric) {
          throw new Error(`Balance must be numeric: ${arg}`)
        }
        break;
      }
      case 'address[]': {
        if (!Array.isArray(arg)) {
          throw new Error('Argument must be array');
        }
        arg.forEach((addrArg) => this._validateArg('address', addrArg));
        break;
      }
      case 'address': {
        if (typeof arg !== 'string') throw new Error('Address must be string');
        // TODO: validate against proper formatting by base/signing protocol
        break;
      }
      default: {
        throw new Error(`Unexpected arg: ${arg}`);
      }
    }
  }

  // check run at rule creation to validate that it was written properly
  // TODO: take db and chain and check address formats
  public validateRule(ruleSchema: SchemaT): SchemaT {
    if (!ruleSchema || !ruleSchema[this.identifier]) throw new Error('Invalid identifier');
    const args = ruleSchema[this.identifier];
    if (!Array.isArray(args)) throw new Error('Arguments must be array');
    args.forEach((arg, index) => {
      const argMetadata = this.metadata.arguments[index];
      if (!argMetadata) throw new Error('Invalid argument index');
      this._validateArg(argMetadata.type, arg);
    });
    const santizedResult = { [this.identifier]: args } as SchemaT;
    return santizedResult;
  }

  // check that the provided arguments pass the rule (i.e. do balance check)
  abstract check(ruleSchema: SchemaT, address: string, chain: string, models?: DB): Promise<boolean>;
}

export function validateRule(ruleSchema: any): DefaultSchemaT {
  const [ ruleId ] = Object.keys(ruleSchema);
  const ruleDef = RuleTypes[ruleId];
  return ruleDef.validateRule(ruleSchema);
}

export async function checkRule(
  models: DB,
  ruleFk: number,
  address: string,
): Promise<boolean> {
  // fetch the rule from the database by id
  // always pass non-configured rules
  if (!ruleFk) return true;
  const ruleInstance = await models.Rule.findOne({ where: { id: ruleFk } });
  if (!ruleInstance) return true;
  const ruleJson = ruleInstance.rule as Record<string, DefaultSchemaT>;

  // parse and run the rule according to its type
  const [[ruleId, ruleSchema]] = Object.entries(ruleJson);
  const ruleDef: RuleType = RuleTypes[ruleId];
  const isValid = await ruleDef.check(ruleSchema, address, ruleInstance.chain_id, models);
  return isValid;
}

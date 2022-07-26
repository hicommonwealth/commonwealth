import type { RuleArgumentType, DefaultSchemaT } from './ruleTypes';
import RuleTypes from '../../ruleTypes';
import { AppError, ServerError } from '../errors';

const MAX_RECURSION_DEPTH = 8;

function validateArg(type: RuleArgumentType, arg: unknown, depth = 0): void {
  // since any/all rules permit indefinite recursion, limit depth to prevent stack overflows
  if (depth > MAX_RECURSION_DEPTH) {
    throw new AppError('Rule depth exceeds max recursion depth');
  }

  switch (type) {
    case 'rule[]': {
      if (!Array.isArray(arg)) {
        throw new AppError('Argument must be array');
      }

      // decompose provided rules
      arg.forEach((ruleArg) => {
        const ruleKeys = Object.keys(ruleArg);
        if (ruleKeys.length !== 1) {
          throw new AppError('Rule must have exactly one key');
        }
        const [ ruleKey ] = ruleKeys;
        const subRuleDefn = RuleTypes[ruleKey];
        if (!subRuleDefn) {
          throw new AppError('Invalid rule name');
        }

        // fetch types of sub rules from global list + ensure provided arguments match
        const subRuleArgTypes = subRuleDefn.metadata.arguments.map(({ type: argType }) => argType);
        const subRuleArgs = ruleArg[ruleKey];
        if (!Array.isArray(subRuleArgs)) {
          throw new AppError('sub rule args must be array');
        }
        if (subRuleArgs.length !== subRuleArgTypes.length) {
          throw new AppError(`invalid arguments provided for rule ${ruleKey}`);
        }
        for (let i = 0; i < subRuleArgs.length; i++) {
          validateArg(subRuleArgTypes[i], subRuleArgs[i], depth + 1);
        }
      })
      break;
    }
    case 'balance[]': {
      if (!Array.isArray(arg)) {
        throw new AppError('Argument must be array');
      }
      arg.forEach((balanceArg) => validateArg('balance', balanceArg, depth + 1));
      break;
    }
    case 'balance': {
      if (typeof arg !== 'string') throw new AppError('Balance must be string');
      const isNumeric = /^\d+$/.test(arg);
      if (!isNumeric) {
        throw new AppError(`Balance must be numeric: ${arg}`)
      }
      break;
    }
    case 'address[]': {
      if (!Array.isArray(arg)) {
        throw new AppError('Argument must be array');
      }
      arg.forEach((addrArg) => validateArg('address', addrArg, depth + 1));
      break;
    }
    case 'address': {
      if (typeof arg !== 'string') throw new AppError('Address must be string');
      // TODO: validate against proper formatting by base/signing protocol
      break;
    }
    default: {
      throw new AppError(`Unexpected arg: ${arg}`);
    }
  }
}

// TODO: take db and chain and check address formats
// check run at rule creation to validate that it was written properly
export function validateRule(ruleSchema: any): DefaultSchemaT {
  const [ ruleId ] = Object.keys(ruleSchema);
  const ruleDef = RuleTypes[ruleId];
  if (!ruleSchema || !ruleSchema[ruleId] || !ruleDef) {
    throw new AppError('Invalid identifier');
  }
  const args = ruleSchema[ruleId];
  if (!Array.isArray(args)) throw new AppError('Arguments must be array');
  args.forEach((arg, index) => {
    const argMetadata = ruleDef.metadata.arguments[index];
    if (!argMetadata) throw new AppError('Invalid argument index');
    validateArg(argMetadata.type, arg);
  });
  const santizedResult = { [ruleId]: args };
  return santizedResult;
}

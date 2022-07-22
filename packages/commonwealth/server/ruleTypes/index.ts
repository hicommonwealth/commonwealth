import { RuleType } from '../util/rules/ruleTypes';
import AdminOnlyRule from './adminOnly';
import AllowListRule from './allowList';
import AnyRule from './any';
import AllRule from './all';

export default {
  AdminOnlyRule: new AdminOnlyRule(),
  AllowListRule: new AllowListRule(),
  AnyRule: new AnyRule(),
  AllRule: new AllRule(),
} as Record<string, RuleType>;

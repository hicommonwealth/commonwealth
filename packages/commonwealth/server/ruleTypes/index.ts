import type { RuleType } from '../util/rules/ruleTypes';
import AdminOnlyRule from './adminOnly';
import AllRule from './all';
import AllowListRule from './allowList';
import AnyRule from './any';

export default {
  AdminOnlyRule: new AdminOnlyRule(),
  AllowListRule: new AllowListRule(),
  AnyRule: new AnyRule(),
  AllRule: new AllRule(),
} as Record<string, RuleType>;

import { RuleType } from '../util/ruleParser';
import AdminOnlyRule from './adminOnly';
import AllowListRule from './allowList';

export default {
  AdminOnlyRule: new AdminOnlyRule(),
  AllowListRule: new AllowListRule(),
} as {[id: string]: RuleType};

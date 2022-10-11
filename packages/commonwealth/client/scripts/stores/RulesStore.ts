import Rule from '../models/Rule';
import IdStore from './IdStore';

class RuleStore extends IdStore<Rule> {
  private _storeRules: { [id: number]: Rule } = {};

  public add(rule: Rule) {
    super.add(rule);
    this._storeRules[rule.id] = rule;
    return this;
  }

  public remove(rule: Rule) {
    super.remove(rule);
    if (this._storeRules[rule.id]) {
      delete this._storeRules[rule.id];
    }
    return this;
  }

  public clear() {
    super.clear();
    this._storeRules = {};
  }
}

export default RuleStore;

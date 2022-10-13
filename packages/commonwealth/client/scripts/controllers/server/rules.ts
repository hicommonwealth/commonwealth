import RuleStore from 'stores/RulesStore';
import app from 'state';
import $ from 'jquery';
import { Rule } from 'models';

class RulesController {
  private _rulesStore = new RuleStore();
  private _ruleTypes = {};

  public get ruleTypes() {
    return this._ruleTypes;
  }

  // Checks if a provided address passes a set of rules
  // Agnostic to chain; this will work even if the rule is not in the store
  public async checkAgainstRules({
    rule_ids,
    address,
  }: {
    rule_ids: Array<number>;
    address: string;
  }) {
    try {
      const res = await $.post(`${app.serverUrl()}/checkRules`, {
        'rule_ids[]': rule_ids,
        address,
        jwt: app.user.jwt,
      });
      return res.result;
    } catch (e) {
      console.log(e);
      throw new Error('Unable to check address against provided rule');
    }
  }

  public async refresh() {
    // First clear the store
    this._rulesStore.clear();

    // Populate store with rules corresponding to current community
    try {
      const res = await $.post(`${app.serverUrl()}/getRules`, {
        chain_id: app.activeChainId() ?? null,
        jwt: app.user.jwt,
      });

      if (res.result.rules.length > 0) {
        await res.result.rules.forEach((rule) => {
          this._rulesStore.add(Rule.fromJSON(rule));
        });
      }
    } catch (e) {
      console.log(e);
      throw new Error('Failed to refresh rules');
    }
  }

  public async createRule({
    chain_id,
    ruleSchema,
  }: {
    chain_id: string;
    ruleSchema: any;
  }) {
    try {
      const res = await $.post(`${app.serverUrl()}/createRule`, {
        chain_id,
        rule: JSON.stringify(ruleSchema),
        jwt: app.user.jwt,
      });
      if (res.result) {
        // Add rule to store if it's for the current chain
        if (res.result.chain_id === app.activeChainId()) {
          this._rulesStore.add(Rule.fromJSON(res.result));
        }
      }
    } catch (e) {
      console.log(e);
      throw new Error('Failed to create rule');
    }
  }

  public async editRule({
    chain_id,
    rule_id,
    updated_rule,
  }: {
    chain_id: string;
    rule_id: number;
    updated_rule: any;
  }) {
    try {
      const res = await $.post(`${app.serverUrl()}/editRule`, {
        rule_id,
        chain_id,
        updated_rule: JSON.stringify(updated_rule),
        jwt: app.user.jwt,
      });
      if (res.result) {
        const ruleInStore = this._rulesStore.getById(rule_id);
        if (chain_id === app.activeChainId() && !ruleInStore) {
          this._rulesStore.add(Rule.fromJSON(res.result));
        }
      }
    } catch (e) {
      console.log(e);
      throw new Error('Failed to edit rule');
    }
  }

  public async deleteRule({
    chain_id,
    rule_id,
  }: {
    chain_id: string;
    rule_id: number;
  }) {
    try {
      const res = await $.post(`${app.serverUrl()}/deleteRule`, {
        rule_id,
        chain_id,
        jwt: app.user.jwt,
      });
      if (res.result) {
        const ruleInStore = this._rulesStore.getById(rule_id);
        if (ruleInStore !== undefined) {
          this._rulesStore.remove(ruleInStore);
        }
      }
    } catch (e) {
      console.log(e);
      throw new Error('Failed to delete rule');
    }
  }

  // Returns a map of { [ruleTypeName]: RuleType }
  public async getRuleTypes() {
    try {
      const res = await $.get(`${app.serverUrl()}/getRuleTypes`);
      this._ruleTypes = res.result;
      return res.result;
    } catch (e) {
      console.log(e);
    }
  }
}

export default RulesController;

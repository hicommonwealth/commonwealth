import RuleStore from 'stores/RulesStore';
import app from 'state';
import $ from 'jquery';
import { Rule } from 'models';

export const ruleModelFromServer = (ruleFromDb) => {
  const { id, chain_id, rule, created_at, updated_at } = ruleFromDb;

  return new Rule({
    id,
    chainId: chain_id,
    rule,
    createdAt: created_at,
    updatedAt: updated_at,
  });
};

class RulesController {
  private _rulesStore = new RuleStore();
  // private _ruleTypeStore = new RuleTypeStore();

  public async refresh() {
    // First clear the store
    this._rulesStore.clear();

    // Populate store with rules corresponding to current community
    try {
      const res = await $.get(`${app.serverUrl()}/getRules`, {
        chain_id: app.activeChainId() ?? null,
        jwt: app.user.jwt,
      });

      if (res.result.rules.length > 0) {
        await res.result.rules.forEach((rule) => {
          this._rulesStore.add(ruleModelFromServer(rule));
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
        if (res.result.chain_id === app.activeChainId()) {
          this._rulesStore.add(ruleModelFromServer(res.result));
        }
      }
    } catch (e) {
      console.log(e);
      throw new Error('Failed to create rule');
    }
  }

  public async editRule() {
    // hits /rule route
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

  public async getRuleTypes() {
    // hits /rule route
  }
}

export default RulesController;

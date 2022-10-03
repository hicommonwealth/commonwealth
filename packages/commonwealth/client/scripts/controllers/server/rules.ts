import RuleStore from 'stores/RulesStore';
import app from 'state';
import $ from 'jquery';
class RulesController {
  private _rulesStore = new RuleStore();
  // private _ruleTypeStore = new RuleTypeStore();

  public async refresh() {
    // Hits route that grabs all the rules, and then updates the store
    try {
      const res = await $.post(`${app.serverUrl()}/getRules`, {
        chain_id: app.activeChainId(),
      });

      await res.rules.forEach((rule) => {
        this._rulesStore.add(rule);
      });
      console.log('rules', this._rulesStore);
    } catch (e) {
      console.log(e);
      throw new Error('Failed to refresh rules');
    }
  }

  public async createRule(chain_id: string, ruleSchema: any) {
    // hits /createRule route
  }

  public async editRule() {
    // hits /rule route
  }

  public async deleteRule() {
    // hits /rule route
  }

  public async getRuleTypes() {
    // hits /rule route
  }
}

export default RulesController;

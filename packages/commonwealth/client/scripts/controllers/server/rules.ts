import RuleStore from 'client/scripts/stores/RulesStore';
import app from 'state';

class RulesController {
  private _rulesStore = new RuleStore();
  // private _ruleTypeStore = new RuleTypeStore();

  public refresh() {
    // Hits route that grabs all the rules, and then updates the store
  }

  public createRule(chain_id: string, ruleSchema: any) {
    // hits /createRule route
  }

  public editRule() {
    // hits /rule route
  }

  public deleteRule() {
    // hits /rule route
  }

  public getRuleTypes() {
    // hits /rule route
  }
}

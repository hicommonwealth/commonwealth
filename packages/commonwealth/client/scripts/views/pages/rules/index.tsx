/* @jsx m */

import m from 'mithril';

import 'pages/rules/index.scss';

import app from 'state';
import { Rule } from 'models';
import { notifySuccess } from 'controllers/app/notifications';

import { CWBreadcrumbs } from '../../components/component_kit/cw_breadcrumbs';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWText } from '../../components/component_kit/cw_text';
import { CWRuleCard } from '../../components/rules';
import RuleModal from '../../components/rules/rule_modal';
import Sublayout from '../../sublayout';
import { PageLoading } from '../loading';

type RulesPageAttrs = {
  title: string;
};

export default class RulesPage implements m.ClassComponent<RulesPageAttrs> {
  private isLoading: boolean;
  private loadingRules: boolean;
  private rules: Array<Rule>;

  oninit() {
    this.isLoading = true;
    this.loadingRules = true;
  }

  view() {
    if (this.isLoading && app.activeChainId()) {
      app.rules.refresh().then(() => {
        this.isLoading = false;
        this.rules = app.rules.getRules;
        this.loadingRules = false;
        m.redraw();
      });
    }

    return this.isLoading ? (
      <PageLoading />
    ) : (
      <Sublayout>
        <div class="RulesPage">
          <div class="top-section">
            <CWBreadcrumbs
              breadcrumbs={[
                { label: app.activeChainId(), path: '' },
                { label: 'Community Rules', path: '' },
              ]}
            />
            <div class="rules-header-section">
              <CWText type="h3">Community Rules</CWText>
              <div class="create-rule-section">
                <CWText type="caption">{`${app.rules.getRules.length} Rules in Use`}</CWText>
                <CWButton
                  iconName="plus"
                  buttonType="mini"
                  label="Create Rule"
                  onclick={() => {
                    app.modals.create({
                      modal: RuleModal,
                      data: {
                        onFinish: async (rule) => {
                          try {
                            this.loadingRules = true;
                            await app.rules.createRule({
                              chain_id: app.activeChainId(),
                              ruleSchema: rule,
                            });
                            this.rules = app.rules.getRules;
                            this.loadingRules = false;
                            notifySuccess('Rule created!');
                            m.redraw();
                          } catch (e) {
                            console.log(e);
                          }
                        },
                      },
                    });
                  }}
                />
              </div>
            </div>
            <CWText className="description">
              This section displays the existing rules for a community and
              allows admins to edit or add new rules.
            </CWText>
          </div>
          <div class="bottom-section">
            {!this.loadingRules &&
              this.rules.map((rule, idx) => {
                return (
                  <CWRuleCard
                    isNested={false}
                    rule={rule.rule}
                    ruleId={rule.id}
                    chainId={app.activeChainId()}
                    ruleCreatedAt={rule.createdAt}
                    ruleUpdatedAt={rule.updatedAt}
                    ruleTypeIdentifier={Object.keys(rule.rule)[0]}
                    adminView={true}
                    onEdit={() => {
                      app.modals.create({
                        modal: RuleModal,
                        data: {
                          onFinish: async (editedRule) => {
                            try {
                              this.loadingRules = true;
                              await app.rules.editRule({
                                chain_id: app.activeChainId(),
                                rule_id: rule.id,
                                updated_rule: editedRule,
                              });
                              this.rules = app.rules.getRules;
                              this.loadingRules = false;

                              notifySuccess('Rule updated!');
                            } catch (e) {
                              console.log(e);
                            }
                          },
                          rule: JSON.parse(JSON.stringify(rule.rule)),
                        },
                      });
                    }}
                    onDelete={async () => {
                      try {
                        this.loadingRules = true;
                        await app.rules.deleteRule({
                          chain_id: app.activeChainId(),
                          rule_id: rule.id,
                        });
                        this.rules = app.rules.getRules;
                        this.loadingRules = false;
                        notifySuccess('Rule deleted!');

                        m.redraw();
                      } catch (e) {
                        console.log('delete error', e);
                      }
                    }}
                  />
                );
              })}
          </div>
        </div>
      </Sublayout>
    );
  }
}

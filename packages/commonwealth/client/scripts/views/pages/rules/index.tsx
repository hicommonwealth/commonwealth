/* @jsx m */

import m from 'mithril';

import 'pages/rules/index.scss';

import app from 'state';
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

  oninit() {
    this.isLoading = true;
  }

  view() {
    if (this.isLoading) {
      app.rules.refresh().then(() => {
        this.isLoading = false;
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
                            await app.rules.createRule({
                              chain_id: app.activeChainId(),
                              ruleSchema: rule,
                            });
                          } catch (e) {
                            console.log(e);
                          }
                          notifySuccess('Rule created!');
                        },
                      },
                    });
                  }}
                />
              </div>
            </div>
            <CWText className="description">
              This section is for the community to discuss how to manage the
              community treasury and spending on contributor grants, community
              initiatives, liquidity mining and other programs.
            </CWText>
          </div>
          <div class="bottom-section">
            {app.rules.getRules.map((rule, idx) => {
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
                          console.log('Edited Rule', editedRule);
                          console.log(
                            'Edited Rule as string',
                            JSON.parse(editedRule)
                          );

                          try {
                            await app.rules.editRule({
                              chain_id: app.activeChainId(),
                              rule_id: rule.id,
                              updated_rule: editedRule,
                            });
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
                      await app.rules.deleteRule({
                        chain_id: app.activeChainId(),
                        rule_id: rule.id,
                      });
                      m.redraw();
                    } catch (e) {
                      console.log('wtf', e);
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

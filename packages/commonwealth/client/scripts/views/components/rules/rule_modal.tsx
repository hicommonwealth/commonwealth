/* eslint-disable no-use-before-define */
/* @jsx m */

import m from 'mithril';

import 'components/rules/rule_modal.scss';

import app from 'state';
import { RuleMetadata } from 'server/util/rules/ruleTypes';
import { CWCard } from '../component_kit/cw_card';
import { CWDropdown } from '../component_kit/cw_dropdown';
import { CWTextInput } from '../component_kit/cw_text_input';
import { CWRuleTable } from './rule_table';
import { CWButton } from '../component_kit/cw_button';
import { CWText } from '../component_kit/cw_text';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';

type RuleEditSectionAttrs = {
  internalBuiltRule: Record<string, unknown>;
  ruleArgument: Array<{
    name: string;
    description: string;
    type: string;
  }>;
  ruleTypeIdentifier: string;
  argumentIdx: number;
};

class RuleEditSection implements m.ClassComponent<RuleEditSectionAttrs> {
  private subRuleResolved: boolean;
  private subRules: Array<RuleMetadata>;

  oninit(vnode) {
    this.subRuleResolved = false;
    this.subRules = [];
  }

  view(vnode) {
    const { internalBuiltRule, ruleArgument, ruleTypeIdentifier, argumentIdx } =
      vnode.attrs;

    if (ruleArgument.type === 'address' || ruleArgument.type === 'balance') {
      return (
        <div class="display-section">
          <CWTextInput
            label={ruleArgument.name}
            placeholder={ruleArgument.description}
            oninput={(e) => {
              internalBuiltRule[ruleTypeIdentifier][argumentIdx] =
                e.target.value;
            }}
          />
        </div>
      );
    } else if (
      ruleArgument.type === 'address[]' ||
      ruleArgument.type === 'balance[]'
    ) {
      return (
        <div class="display-section">
          <CWTextInput
            label={`Add ${ruleArgument.description}`}
            placeholder={ruleArgument.description}
            onenterkey={(e) => {
              internalBuiltRule[ruleTypeIdentifier][argumentIdx].unshift(
                e.target.value
              );
            }}
            clearOnEnter
          />
          <CWRuleTable
            title={ruleArgument.description}
            data={internalBuiltRule[ruleTypeIdentifier][argumentIdx]}
          />
        </div>
      );
    } else if (ruleArgument.type === 'rule[]') {
      return (
        <div class="display-section">
          {internalBuiltRule[ruleTypeIdentifier][argumentIdx].map(
            (rule, idx) => {
              return (
                <div class="completed-rule-display">
                  <CWText type="h5">{Object.keys(rule)[0]}</CWText>
                  <div class="icons-display">
                    <CWIcon iconName="write" />
                    <CWIcon
                      iconName="trash"
                      onclick={() => {
                        console.log(
                          '2',
                          internalBuiltRule,
                          internalBuiltRule[ruleTypeIdentifier],
                          internalBuiltRule[ruleTypeIdentifier][argumentIdx]
                        );
                        // internalBuiltRule[ruleTypeIdentifier] = [];
                        m.redraw();
                      }}
                    />
                  </div>
                </div>
              );
            }
          )}
          {!this.subRuleResolved ? (
            <RuleModal
              isNested
              onFinish={(rule) => {
                internalBuiltRule[ruleTypeIdentifier][argumentIdx].push(rule);
                this.subRuleResolved = true;
              }}
            />
          ) : (
            <CWButton
              onclick={() => {
                this.subRuleResolved = false;
              }}
              label="add rule"
            />
          )}
        </div>
      );
    }
    return <div></div>;
  }
}

type RuleModalAttrs = {
  onFinish: (rule: Record<string, unknown>) => void;
  isNested?: boolean;
  rule?: Record<string, unknown>;
  className?: string;
};

class RuleModal implements m.ClassComponent<RuleModalAttrs> {
  private editingRule: boolean;
  private showSelectRule: boolean;
  private showRuleOptions: boolean;
  private internalBuiltRule: Record<string, unknown>;
  private ruleMetadata: RuleMetadata;

  oninit(vnode) {
    this.editingRule = vnode.attrs.rule !== undefined;
    if (this.editingRule) {
      this.internalBuiltRule = vnode.attrs.rule;
      this.showSelectRule = false;
      this.showRuleOptions = true;
      // TODO: Should this ever not be index 0?
      this.ruleMetadata = app.rules.ruleTypes[Object.keys(vnode.attrs.rule)[0]];
    } else {
      this.internalBuiltRule = {};
      this.showSelectRule = true;
      this.showRuleOptions = false;
    }
  }

  view(vnode) {
    const { onFinish, isNested } = vnode.attrs;

    const ruleOptions = Object.keys(app.rules.ruleTypes).map((ruleType) => {
      return { label: ruleType };
    });

    return (
      <CWCard
        elevation="elevation-3"
        className={`RuleModal${isNested ? ` child-modal` : ''}`}
      >
        <div class="title-section">
          <CWText type="h3" fontStyle="semiBold">
            Title
          </CWText>
          <CWText type="b1">Subheader message text</CWText>
        </div>
        {this.showSelectRule && (
          <CWDropdown
            inputOptions={ruleOptions}
            onSelect={(optionLabel: string) => {
              // Clear out the internal built rule in event of switch
              this.internalBuiltRule = {};
              this.ruleMetadata = app.rules.ruleTypes[optionLabel];

              // Create correct structure for rule
              const ruleValue = [];
              for (const argument of this.ruleMetadata.arguments) {
                if (
                  argument.type === 'address[]' ||
                  argument.type === 'balance[]' ||
                  argument.type === 'rule[]'
                ) {
                  ruleValue.push([]);
                } else if (
                  argument.type === 'address' ||
                  argument.type === 'balance'
                ) {
                  ruleValue.push('');
                }
              }
              this.internalBuiltRule[optionLabel] = ruleValue;

              this.showRuleOptions = true;
            }}
            initialValue="Select Rule Type"
          />
        )}
        {this.showRuleOptions &&
          this.ruleMetadata.arguments.map((argument, idx) => {
            return (
              <RuleEditSection
                ruleArgument={argument}
                argumentIdx={idx}
                internalBuiltRule={this.internalBuiltRule}
                ruleTypeIdentifier={Object.keys(this.internalBuiltRule)[0]}
              />
            );
          })}
        <div class="footer-section">
          <CWButton
            label="Finish"
            onclick={() => {
              onFinish(this.internalBuiltRule);
            }}
          />
        </div>
      </CWCard>
    );
  }
}

export default RuleModal;

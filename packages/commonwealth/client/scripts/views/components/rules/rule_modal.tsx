/* eslint-disable no-use-before-define */
/* @jsx m */

import m from 'mithril';
import $ from 'jquery';

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

// Handles the details of displaying a rule
class RuleEditSection implements m.ClassComponent<RuleEditSectionAttrs> {
  private subRuleResolved: boolean;
  private subRules: Array<RuleMetadata | any>;
  private subRuleEditState: Array<boolean>;

  oninit(vnode) {
    const { internalBuiltRule, ruleTypeIdentifier } = vnode.attrs;

    this.subRuleResolved = true;
    this.subRules = internalBuiltRule[ruleTypeIdentifier]; // Only applicable for compound rules
    this.subRuleEditState = this.subRules.map(() => false);
  }

  onupdate(vnode) {
    const { internalBuiltRule, ruleTypeIdentifier, argumentIdx } = vnode.attrs;
    this.subRules = internalBuiltRule[ruleTypeIdentifier];
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
      // If i have a rule argument, I need to
      // 1. check if it already has subrules defined. If so, I should display them as COMPLETED
      // 2. If it doesnt have subrules defined, I should show a new sub modal to create one
      return (
        <div class="display-section">
          {internalBuiltRule[ruleTypeIdentifier].map((subRule, idx) => {
            if (this.subRuleEditState[idx]) {
              return (
                <RuleModal
                  isNested
                  onFinish={(rule) => {
                    internalBuiltRule[ruleTypeIdentifier][idx] = [rule];
                    this.subRuleEditState[idx] = false;
                  }}
                  rule={subRule[0]}
                  onCancel={(
                    internalRule: Record<string, unknown>,
                    ruleValid: boolean
                  ) => {
                    if (Object.keys(internalRule).length > 0 && ruleValid) {
                      this.subRuleEditState[idx] = false;
                    } else {
                      this.subRules = this.subRules.filter((val, i) => {
                        return i !== idx;
                      });
                      this.subRuleEditState = this.subRuleEditState.filter(
                        (val, i) => {
                          return i !== idx;
                        }
                      );
                      internalBuiltRule[ruleTypeIdentifier] = this.subRules;
                      m.redraw();
                    }
                  }}
                />
              );
            } else {
              return (
                <div class="completed-rule-display">
                  <CWText type="h5">{Object.keys(subRule[0])[0]}</CWText>
                  <div class="icons-display">
                    <CWIcon
                      iconName="write"
                      onclick={() => {
                        this.subRuleEditState[idx] = true;
                        m.redraw();
                      }}
                    />
                    <CWIcon
                      iconName="trash"
                      onclick={() => {
                        this.subRules = this.subRules.filter((val, i) => {
                          return i !== idx;
                        });
                        this.subRuleEditState = this.subRuleEditState.filter(
                          (val, i) => {
                            return i !== idx;
                          }
                        );
                        internalBuiltRule[ruleTypeIdentifier] = this.subRules;
                        m.redraw();
                      }}
                    />
                  </div>
                </div>
              );
            }
          })}
          <div className="add-button-wrapper">
            <CWButton
              onclick={() => {
                this.subRules.push([{}]);
                this.subRuleEditState.push(true);
                internalBuiltRule[ruleTypeIdentifier] = this.subRules;
                m.redraw();
              }}
              label="add subrule"
              iconName="plus"
              buttonType="mini"
            />
          </div>
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
  onCancel?: () => void;
};

class RuleModal implements m.ClassComponent<RuleModalAttrs> {
  private editingRule: boolean;
  private showSelectRule: boolean;
  private showRuleOptions: boolean;
  private internalBuiltRule: Record<string, unknown>;
  private ruleMetadata: RuleMetadata;
  private readyForReview: boolean;
  private readyForSubmit: boolean;
  private ruleInitiallyValid: boolean;

  oninit(vnode) {
    this.editingRule =
      vnode.attrs.rule !== undefined &&
      Object.keys(vnode.attrs.rule).length > 0;
    if (this.editingRule) {
      this.internalBuiltRule = vnode.attrs.rule;
      this.showSelectRule = false;
      this.showRuleOptions = true;
      this.ruleMetadata = app.rules.ruleTypes[Object.keys(vnode.attrs.rule)[0]];
      this.ruleInitiallyValid = true;
    } else {
      this.internalBuiltRule = {};
      this.showSelectRule = true;
      this.ruleInitiallyValid = false;
    }
    this.readyForReview = false;
    this.readyForSubmit = false;
  }

  view(vnode) {
    const { onFinish, isNested, onCancel } = vnode.attrs;

    const ruleOptions = Object.keys(app.rules.ruleTypes).map((ruleType) => {
      return { label: ruleType };
    });

    return (
      <CWCard
        elevation="elevation-3"
        className={`RuleModal${isNested ? ` child-modal` : ''}`}
      >
        <div className="top-section">
          <div class="title-section">
            <CWText type="h3" fontStyle="semiBold">
              {this.ruleMetadata && !this.readyForReview
                ? this.ruleMetadata.name
                : this.readyForReview
                ? 'Review Your Rule'
                : `Select ${isNested ? 'Subr' : 'R'}ule Type`}
            </CWText>
            <CWText type="b1">
              {this.ruleMetadata ? this.ruleMetadata.description : ''}
            </CWText>
          </div>
          {this.showSelectRule && (
            <CWDropdown
              inputOptions={ruleOptions}
              onSelect={(optionLabel: string) => {
                // Clear out the internal built rule in event of switch
                this.internalBuiltRule = {};
                this.ruleMetadata = app.rules.ruleTypes[optionLabel];
                this.readyForReview = false;
                this.readyForSubmit = false;

                // Create correct structure for rule
                const ruleValue = [];
                for (const argument of this.ruleMetadata.arguments) {
                  if (
                    argument.type === 'address[]' ||
                    argument.type === 'balance[]'
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
                m.redraw();
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
        </div>

        <div class="footer-section">
          <CWButton
            label="Cancel"
            buttonType="secondary-black"
            onclick={() => {
              if (isNested && onCancel) {
                onCancel(this.internalBuiltRule, this.ruleInitiallyValid);
              } else {
                $('.RuleModal').trigger('modalexit');
              }
            }}
            className="cancel-button"
          />
          {this.readyForSubmit ? (
            <CWButton
              label="Finish"
              onclick={() => {
                onFinish(this.internalBuiltRule);
                if (!isNested) {
                  $('.RuleModal').trigger('modalexit');
                }
              }}
            />
          ) : (
            <CWButton
              label="Next"
              buttonType="primary-black"
              onclick={() => {
                if (Object.keys(this.internalBuiltRule).length > 0) {
                  this.readyForReview = true;
                  this.readyForSubmit = true;
                  m.redraw();
                }
              }}
            />
          )}
        </div>
      </CWCard>
    );
  }
}

export default RuleModal;

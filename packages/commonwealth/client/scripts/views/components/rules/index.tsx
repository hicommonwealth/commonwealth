/* @jsx m */

import Rule from 'client/scripts/models/Rule';
import m from 'mithril';
import moment from 'moment';

import 'components/rules/cw_rule_card.scss';

import { RuleMetadata } from 'server/util/rules/ruleTypes';
import app from 'state';
import { CWCard } from '../component_kit/cw_card';
import { ComponentType } from '../component_kit/types';
import { CWRuleTable } from './rule_table';
import { AttributeDisplay } from './attribute_display';
import { CWText } from '../component_kit/cw_text';
import { CWDivider } from '../component_kit/cw_divider';

type RuleDisplaySectionAttrs = {
  rule: Rule;
  ruleMetadata: RuleMetadata;
  parentIsNested: boolean;
};

class RuleDisplaySection implements m.ClassComponent<RuleDisplaySectionAttrs> {
  view(vnode) {
    const { rule, ruleMetadata, parentIsNested } = vnode.attrs;

    return (
      <div>
        {ruleMetadata.arguments.map((argument, idx) => {
          return <div></div>;
        })}
      </div>
    );
  }
}

type RulesCardAttrs = {
  isNested: boolean;
  rule: Rule;
  ruleTypeIdentifier: string;
  ruleMetadata: RuleMetadata;
  adminView: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddRule?: () => void;
};

export class CWRuleCard implements m.ClassComponent<RulesCardAttrs> {
  view(vnode) {
    const {
      isNested,
      rule,
      ruleTypeIdentifier,
      ruleMetadata,
      adminView,
      onEdit,
      onDelete,
      onAddRule,
    } = vnode.attrs;

    return (
      <CWCard
        className={ComponentType.RuleCard}
        elevation={isNested ? 'elevation-1' : 'elevation-3'}
      >
        <div class="header-section">
          <div class="title-section">
            <CWText fontWeight={600} type="bold">
              {ruleMetadata.name}
            </CWText>
            {!isNested && (
              <CWText
                type="caption"
                className="published-text"
              >{`published on ${moment(rule.createdAt).format(
                'DD/MM/YY'
              )}`}</CWText>
            )}
          </div>
          <CWDivider />
          <CWText className="description">{ruleMetadata.description}</CWText>
        </div>

        {/* <CWRuleTable title="Title" data={rule.rule[ruleTypeIdentifier][0]} />
        <AttributeDisplay
          label="address"
          value="0xE58E375Cc657e434e6981218A356fAC756b98097"
        /> */}
        {isNested && (
          <CWRuleTable title="Title" data={rule.rule[ruleTypeIdentifier][0]} />
        )}
        {ruleMetadata.arguments.map((argument, idx) => {
          return <div></div>;
        })}
        {!isNested && (
          <CWRuleCard
            isNested={true}
            rule={rule}
            ruleMetadata={ruleMetadata}
            ruleTypeIdentifier={ruleTypeIdentifier}
          />
        )}
        {!isNested && (
          <div class="footer-section">
            <CWText type="caption" className="edited-text">
              {`Last edited ${moment(rule.updatedAt).format('DD/MM/YY')}`}
            </CWText>
          </div>
        )}
      </CWCard>
    );
  }
}

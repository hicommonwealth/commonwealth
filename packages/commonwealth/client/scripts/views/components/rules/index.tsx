/* eslint-disable no-use-before-define */
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
import { CWPopoverMenu } from '../component_kit/cw_popover/cw_popover_menu';
import { CWIconButton } from '../component_kit/cw_icon_button';

type RuleDisplaySectionAttrs = {
  rule: Record<string, unknown>;
  ruleId: number;
  chainId: string;
  ruleCreatedAt: number;
  ruleUpdatedAt: number;
  ruleTypeIdentifier: string;
  ruleArgument: Array<{
    name: string;
    description: string;
    type: string;
  }>;
  argumentIdx: number;
};

class RuleDisplaySection implements m.ClassComponent<RuleDisplaySectionAttrs> {
  view(vnode) {
    const {
      rule,
      ruleId,
      chainId,
      ruleCreatedAt,
      ruleUpdatedAt,
      ruleTypeIdentifier,
      ruleArgument,
      argumentIdx,
    } = vnode.attrs;

    if (ruleArgument.type === 'address' || ruleArgument.type === 'balance') {
      // TODO: What does one of these look like to get value
      return (
        <div class="display-section">
          <AttributeDisplay
            label={ruleArgument.description}
            value={rule[ruleTypeIdentifier][argumentIdx]}
          />
        </div>
      );
    } else if (
      ruleArgument.type === 'balance[]' ||
      ruleArgument.type === 'address[]'
    ) {
      return (
        <div class="display-section">
          <CWRuleTable
            title={ruleArgument.description}
            data={rule[ruleTypeIdentifier][0]}
          />
        </div>
      );
    } else if (ruleArgument.type === 'rule[]') {
      return rule[ruleTypeIdentifier].map((subRule) => {
        return (
          <div class="display-section">
            <CWRuleCard
              isNested={true}
              rule={subRule[0]}
              ruleId={ruleId}
              chainId={chainId}
              ruleCreatedAt={ruleCreatedAt}
              ruleUpdatedAt={ruleUpdatedAt}
              adminView={false}
              ruleTypeIdentifier={Object.keys(subRule[0])[0]}
            />
          </div>
        );
      });
    } else {
      return <div></div>;
    }
  }
}

type RulesCardAttrs = {
  isNested: boolean;
  rule: Record<string, unknown>;
  ruleId: number;
  chainId: string;
  ruleCreatedAt: number;
  ruleUpdatedAt: number;
  ruleTypeIdentifier: string;
  adminView: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddRule?: () => void;
};

export class CWRuleCard implements m.ClassComponent<RulesCardAttrs> {
  private ruleMetadata: RuleMetadata;

  oninit(vnode) {
    const ruleTypeMap = app.rules.ruleTypes;
    this.ruleMetadata = ruleTypeMap[vnode.attrs.ruleTypeIdentifier];
  }

  view(vnode) {
    const {
      isNested,
      rule,
      ruleId,
      chainId,
      ruleCreatedAt,
      ruleUpdatedAt,
      ruleTypeIdentifier,
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
          <div class="top-section">
            <div class="title-section">
              <CWText fontWeight={600} type="bold">
                {this.ruleMetadata.name}
              </CWText>
              {!isNested && (
                <CWText
                  type="caption"
                  className="published-text"
                >{`published on ${moment(ruleCreatedAt).format(
                  'DD/MM/YY'
                )}`}</CWText>
              )}
            </div>
            {adminView && (
              <CWPopoverMenu
                trigger={
                  <CWIconButton iconName="dotsVertical" iconSize="small" />
                }
                menuItems={[
                  {
                    label: 'Edit',
                    iconName: 'plusCircle',
                    onclick: onEdit,
                  },
                  {
                    label: 'Add Rule',
                    iconName: 'write',
                    onclick: onAddRule,
                  },
                  { type: 'divider' },
                  {
                    label: 'Delete',
                    iconName: 'trash',
                    onclick: onDelete,
                  },
                ]}
              />
            )}
          </div>
          <CWDivider />
          <CWText className="description">
            {this.ruleMetadata.description}
          </CWText>
        </div>

        {this.ruleMetadata.arguments.map((argument, idx) => {
          return (
            <RuleDisplaySection
              rule={rule}
              ruleId={ruleId}
              chainId={chainId}
              ruleCreatedAt={ruleCreatedAt}
              ruleUpdatedAt={ruleUpdatedAt}
              ruleArgument={argument}
              ruleTypeIdentifier={ruleTypeIdentifier}
              argumentIdx={idx}
            />
          );
        })}

        {!isNested && (
          <div class="footer-section">
            <CWText type="caption" className="edited-text">
              {`Last edited ${moment(ruleUpdatedAt).format('DD/MM/YY')}`}
            </CWText>
          </div>
        )}
      </CWCard>
    );
  }
}

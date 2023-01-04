/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'components/rules/rule_table.scss';
import { CWText } from '../component_kit/cw_text';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';

type RuleTableAttrs = {
  title: string;
  data: string[];
  onDelete?: (index: number) => void;
  maxResults?: number;
};

export class CWRuleTable extends ClassComponent<RuleTableAttrs> {
  view(vnode) {
    const { title, data, maxResults, onDelete } = vnode.attrs;

    return (
      <div class="RuleTable">
        <CWText className="title" style="regular" type="caption">
          {title}
        </CWText>
        <div class="table-section">
          {data &&
            data.map((value, idx) => {
              if (maxResults && idx + 1 > maxResults) return;
              return (
                <div class="table-row">
                  <CWText>{value}</CWText>
                  {onDelete && (
                    <CWIcon
                      iconName="trash"
                      onclick={() => onDelete(idx)}
                      className="trash-icon"
                    />
                  )}
                </div>
              );
            })}
          {!data || (data.length === 0 && <div class="table-row"></div>)}
        </div>
      </div>
    );
  }
}

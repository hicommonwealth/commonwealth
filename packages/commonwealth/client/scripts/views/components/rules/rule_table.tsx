/* @jsx m */

import m from 'mithril';

import 'components/rules/rule_table.scss';
import { CWText } from '../component_kit/cw_text';

type RuleTableAttrs = {
  title: string;
  data: string[];
  maxResults?: number;
};

export class CWRuleTable implements m.ClassComponent<RuleTableAttrs> {
  view(vnode) {
    const { title, data, maxResults } = vnode.attrs;

    return (
      <div class="RuleTable">
        <CWText className="title" fontStyle="regular" type="caption">
          {title}
        </CWText>
        <div class="table-section">
          {data.map((value, idx) => {
            if (maxResults && idx + 1 > maxResults) return;
            return (
              <div class="table-row">
                <CWText>{value}</CWText>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

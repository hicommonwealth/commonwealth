/* @jsx m */

import m from 'mithril';

import 'components/gov_explainer.scss';
import { CWText } from './component_kit/cw_text';

type StatHeader = {
  statName: string;
  statDescription: string;
};

type Stat = {
  statHeading: string;
  stat: any;
};

type GovExplainerAttrs = {
  statHeaders: StatHeader[];
  stats: Stat[];
  statAction?: any;
};

export class GovExplainer implements m.ClassComponent<GovExplainerAttrs> {
  view(vnode) {
    const { statHeaders, stats, statAction } = vnode.attrs;

    return (
      <div class="GovExplainer">
        <div class="emoji">💭</div>
        <div class="main-container">
          <div class="stat-headers-container">
            {statHeaders.map((s) => (
              <CWText>
                <div>
                  <b>{s.statName}</b> {s.statDescription}
                </div>
              </CWText>
            ))}
          </div>
          <div class="stats-container">
            {stats.map((s) => (
              <div class="stat">
                <CWText type="b1" fontWeight="medium" className="stat-text">
                  {s.statHeading}
                </CWText>
                <CWText type="b1" fontWeight="medium">
                  {s.stat}
                </CWText>
              </div>
            ))}
          </div>
          {statAction}
        </div>
      </div>
    );
  }
}

/* @jsx jsx */


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

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

export class GovExplainer extends ClassComponent<GovExplainerAttrs> {
  view(vnode: ResultNode<GovExplainerAttrs>) {
    const { statHeaders, stats, statAction } = vnode.attrs;

    return (
      <div className="GovExplainer">
        <div className="emoji">💭</div>
        <div className="main-container">
          <div className="stat-headers-container">
            {statHeaders.map((s) => (
              <CWText>
                <div>
                  <b>{s.statName}</b> {s.statDescription}
                </div>
              </CWText>
            ))}
          </div>
          <div className="stats-container">
            {stats.map((s) => (
              <div className="stat">
                <CWText type="b1" fontWeight="medium" class="stat-text">
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

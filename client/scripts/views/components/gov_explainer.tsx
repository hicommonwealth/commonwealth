/* @jsx m */

import m from 'mithril';

import 'pages/gov_explainer.scss';

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
              <div class="stat-header">
                <strong>{s.statName}</strong>
                <span>{s.statDescription}</span>
              </div>
            ))}
          </div>
          <div class="stats-container">
            {stats.map((s) => (
              <div class="stat">
                {s.statHeader}
                {s.stat}
              </div>
            ))}
          </div>
          <div class="action">{statAction}</div>
        </div>
      </div>
    );
  }
}

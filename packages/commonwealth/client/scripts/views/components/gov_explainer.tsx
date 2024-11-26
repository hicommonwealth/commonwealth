import React from 'react';

import { CWText } from './component_kit/cw_text';
import './gov_explainer.scss';

type StatHeader = {
  statName: string;
  statDescription: string;
};

type Stat = {
  statHeading: string;
  stat: any;
};

type GovExplainerProps = {
  statHeaders: StatHeader[];
  stats: Stat[];
  statAction?: any;
};

export const GovExplainer = (props: GovExplainerProps) => {
  const { statHeaders, stats, statAction } = props;

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
};

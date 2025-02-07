import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';

import GeckoTerminalChart from 'client/scripts/views/components/GekoTerminalChart/GekoTerminalChart';
import { CWIcon } from 'client/scripts/views/components/component_kit/cw_icons/cw_icon';
import { Link } from 'react-router-dom';
import './TokenPerformance.scss';

const TokenPerformance = () => {
  return (
    <div className="TokenPerformance">
      <div className="heading-container">
        <CWText type="h2">Token Performance</CWText>
        <Link to="/explore">
          <div className="link-right">
            <CWText className="link">See top movers</CWText>
            <CWIcon iconName="arrowRightPhosphor" className="blue-icon" />
          </div>
        </Link>
      </div>
      <>
        <GeckoTerminalChart
          chain="base"
          width="650px"
          height="500px"
          poolAddress="0x7d49a065d17d6d4a55dc13649901fdbb98b2afba"
          info={false}
          swaps={false}
        />
      </>
    </div>
  );
};

export default TokenPerformance;

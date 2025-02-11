import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';

import './PriceChartTab.scss';

const PriceChartTab = () => {
  return (
    <div className="PriceChartTab">
      <CWText type="h3" fontWeight="semiBold">
        Price Chart
      </CWText>
      Price Chart component here
    </div>
  );
};

export default PriceChartTab;

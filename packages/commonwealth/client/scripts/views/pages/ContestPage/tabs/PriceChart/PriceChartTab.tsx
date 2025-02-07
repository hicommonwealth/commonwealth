import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';

import './PriceChartTab.scss';

const PriceChartTab = () => {
  return (
    <div className="PriceChartTab">
      <CWText type="h3" fontWeight="semiBold">
        Price Chart
      </CWText>
      {/* Add price chart content here */}
    </div>
  );
};

export default PriceChartTab;

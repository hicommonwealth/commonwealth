import GeckoTerminalChart from 'client/scripts/views/components/GekoTerminalChart/GekoTerminalChart';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import useTokenData from '../../hooks/useTokenData';
import './PriceChartTab.scss';

const PriceChartTab = () => {
  const { chain, address } = useTokenData();

  if (!chain || !address)
    return (
      <div className="PriceChartTab">
        <CWText type="h3" fontWeight="semiBold">
          Price Chart
        </CWText>
        <CWText>Token Data Not Found</CWText>
      </div>
    );

  return (
    <div className="PriceChartTab">
      <CWText type="h3" fontWeight="semiBold">
        Price Chart
      </CWText>

      <GeckoTerminalChart
        className="GekoChartContestPage"
        chain={chain}
        poolAddress={address}
        info={false}
        swaps={true}
      />
    </div>
  );
};

export default PriceChartTab;

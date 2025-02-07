import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';

import './TokenSwapTab.scss';

const TokenSwapTab = () => {
  return (
    <div className="TokenSwapTab">
      <CWText type="h3" fontWeight="semiBold">
        Token Swap
      </CWText>
      {/* Add token swap content here */}
    </div>
  );
};

export default TokenSwapTab;

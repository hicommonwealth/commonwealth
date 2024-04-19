import React from 'react';

import { CWText } from 'views/components/component_kit/cw_text';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';

import './FundContestLoading.scss';

const FundContestLoading = () => {
  return (
    <div className="FundContestLoading">
      <CWCircleMultiplySpinner />
      <CWText fontWeight="medium">Waiting for transaction</CWText>
    </div>
  );
};

export default FundContestLoading;

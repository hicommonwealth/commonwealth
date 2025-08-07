import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import CWCircleMultiplySpinner from 'views/components/component_kit/CWCircleMultiplySpinner';
import { CWModalBody } from 'views/components/component_kit/CWModal';

import './TransactionLoading.scss';

const TransactionLoading = () => {
  return (
    <div className="TransactionLoading">
      <CWModalBody>
        <CWCircleMultiplySpinner />
        <CWText fontWeight="medium">Waiting for transaction</CWText>
      </CWModalBody>
    </div>
  );
};

export default TransactionLoading;

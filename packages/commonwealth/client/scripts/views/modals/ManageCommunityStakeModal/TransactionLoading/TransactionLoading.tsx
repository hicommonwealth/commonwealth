import CWCircleMultiplySpinner from 'client/scripts/views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWModalBody } from 'views/components/component_kit/new_designs/CWModal';

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

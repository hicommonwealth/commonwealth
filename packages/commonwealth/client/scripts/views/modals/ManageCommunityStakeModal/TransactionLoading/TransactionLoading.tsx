import React from 'react';

import { CWText } from 'views/components/component_kit/cw_text';
import CWLoadingSpinner from 'views/components/component_kit/new_designs/CWLoadingSpinner';
import { CWModalBody } from 'views/components/component_kit/new_designs/CWModal';

import './TransactionLoading.scss';

const TransactionLoading = () => {
  return (
    <div className="TransactionLoading">
      <CWModalBody>
        <CWLoadingSpinner center />
        <CWText fontWeight="medium">Waiting for transaction</CWText>
      </CWModalBody>
    </div>
  );
};

export default TransactionLoading;

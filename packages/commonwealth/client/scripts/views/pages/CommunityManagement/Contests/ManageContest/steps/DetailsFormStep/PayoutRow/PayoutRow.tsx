import moment from 'moment/moment';
import React from 'react';

import NumberSelector from 'views/components/NumberSelector';
import { CWText } from 'views/components/component_kit/cw_text';
import { MessageRow } from 'views/components/component_kit/new_designs/CWTextInput/MessageRow';

import { getPrizeColor } from '../utils';

import './PayoutRow.scss';

interface PayoutRowProps {
  payoutStructure: number[];
  onSetPayoutStructure: (payoutStructure: number[]) => void;
  index: number;
  payoutNumber: number;
}

const PayoutRow = ({
  payoutStructure,
  onSetPayoutStructure,
  index,
  payoutNumber,
}: PayoutRowProps) => {
  return (
    <>
      <div className="payout-row">
        <div className="left-side">
          <div
            className="color-square"
            style={{ backgroundColor: getPrizeColor(index) }}
          ></div>
          <CWText type="h5">
            {moment.localeData().ordinal(index + 1)} Prize
          </CWText>
        </div>
        <div className="right-side">
          <NumberSelector
            value={payoutNumber + '%'}
            key={index}
            onInput={(e) => {
              let value = e.target.value;

              if (!value.includes('%')) {
                value = value.slice(0, value.length - 1);
              } else {
                value = value.replace(/%/g, '');
              }

              if (isNaN(Number(value))) {
                return;
              }

              const newPayoutStructure = [
                ...payoutStructure.slice(0, index),
                Number(value),
                ...payoutStructure.slice(index + 1),
              ];
              onSetPayoutStructure(newPayoutStructure);
            }}
            minusDisabled={payoutStructure[index] === 0}
            onMinusClick={() => {
              const updatedPayoutStructure = [...payoutStructure];
              updatedPayoutStructure[index] -= 1;
              onSetPayoutStructure(updatedPayoutStructure);
            }}
            onPlusClick={() => {
              const updatedPayoutStructure = [...payoutStructure];
              updatedPayoutStructure[index] += 1;
              onSetPayoutStructure(updatedPayoutStructure);
            }}
          />
        </div>
      </div>
      <MessageRow
        hasFeedback={payoutNumber < 1}
        validationStatus="failure"
        statusMessage="Prize must be greater than 0%"
      />
    </>
  );
};

export default PayoutRow;

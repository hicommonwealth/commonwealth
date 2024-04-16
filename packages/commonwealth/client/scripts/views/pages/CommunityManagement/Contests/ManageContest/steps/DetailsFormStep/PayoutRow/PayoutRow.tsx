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
  const handleInput = (e) => {
    let value = e.target.value.trim();

    // percentage symbol is inserted in the input so this logic
    // helps edit the input without messing with percentage symbol

    if (!value.includes('%')) {
      // this means that user hit "backspace" so we remove last character
      // before the percentage symbol
      value = value.slice(0, value.length - 1);
    } else {
      // this means that user hit some other symbol, so for time being
      // we need to remove percentage symbol
      value = value.replace(/%/g, '');
    }

    if (isNaN(Number(value))) {
      // eg if user typed non-numeric character
      return;
    }

    const newPayoutStructure = [
      ...payoutStructure.slice(0, index),
      Number(value),
      ...payoutStructure.slice(index + 1),
    ];
    onSetPayoutStructure(newPayoutStructure);
  };

  const handleMinusClick = () => {
    const updatedPayoutStructure = [...payoutStructure];
    updatedPayoutStructure[index] -= 1;
    onSetPayoutStructure(updatedPayoutStructure);
  };

  const handlePlusClick = () => {
    const updatedPayoutStructure = [...payoutStructure];
    updatedPayoutStructure[index] += 1;
    onSetPayoutStructure(updatedPayoutStructure);
  };

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
            onInput={handleInput}
            minusDisabled={payoutStructure[index] === 0}
            onMinusClick={handleMinusClick}
            onPlusClick={handlePlusClick}
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

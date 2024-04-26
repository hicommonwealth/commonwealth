import React from 'react';

import { saveToClipboard } from 'utils/clipboard';
import { CWText } from 'views/components/component_kit/cw_text';
import CWIconButton from 'views/components/component_kit/new_designs/CWIconButton';

import './CopyAddressInput.scss';

interface CopyAddressInputProps {
  address: string;
}

const CopyAddressInput = ({ address }: CopyAddressInputProps) => {
  const handleCopyLink = async () => {
    await saveToClipboard(address, true);
  };

  return (
    <div className="CopyAddressInput">
      <CWText type="b2" className="address" fontWeight="medium">
        {address}
      </CWText>
      <CWIconButton
        iconName="copyNew"
        buttonSize="med"
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onClick={handleCopyLink}
      />
    </div>
  );
};

export default CopyAddressInput;

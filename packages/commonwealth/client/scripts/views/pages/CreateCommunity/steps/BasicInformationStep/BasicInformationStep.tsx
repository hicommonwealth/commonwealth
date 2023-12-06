import React from 'react';

import AddressInfo from 'models/AddressInfo';
import { SelectedCommunity } from 'views/components/component_kit/new_designs/CWCommunitySelector';
import './BasicInformationStep.scss';

interface BasicInformationStepProps {
  selectedAddress: AddressInfo;
  selectedCommunity: SelectedCommunity;
}

const BasicInformationStep = ({
  selectedAddress,
  selectedCommunity,
}: BasicInformationStepProps) => {
  return (
    <div className="BasicInformationStep">
      BasicInformationStep
      <div>selected address: {selectedAddress?.address}</div>
      <div>selected community type: {selectedCommunity.type}</div>
      <div>selected community base: {selectedCommunity.chainBase}</div>
    </div>
  );
};

export default BasicInformationStep;

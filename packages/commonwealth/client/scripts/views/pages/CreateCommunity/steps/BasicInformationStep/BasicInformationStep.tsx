import React from 'react';

import AddressInfo from 'models/AddressInfo';
import { CommunityType } from 'views/components/component_kit/new_designs/CWCommunitySelector';
import './BasicInformationStep.scss';

interface BasicInformationStepProps {
  selectedAddress: AddressInfo;
  selectedCommunityType: CommunityType;
}

const BasicInformationStep = ({
  selectedAddress,
  selectedCommunityType,
}: BasicInformationStepProps) => {
  return (
    <div className="BasicInformationStep">
      BasicInformationStep
      <div>selected address: {selectedAddress?.address}</div>
      <div>selected community type: {selectedCommunityType}</div>
    </div>
  );
};

export default BasicInformationStep;

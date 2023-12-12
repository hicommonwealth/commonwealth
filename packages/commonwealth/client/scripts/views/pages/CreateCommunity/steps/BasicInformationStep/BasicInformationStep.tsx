import AddressInfo from 'models/AddressInfo';
import React from 'react';
import { SelectedCommunity } from 'views/components/component_kit/new_designs/CWCommunitySelector';
import BasicInformationForm from './BasicInformationForm/BasicInformationForm';
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
      <div>selected address: {selectedAddress?.address}</div>
      <div>selected community type: {selectedCommunity.type}</div>
      <div>selected community base: {selectedCommunity.chainBase}</div>
      <BasicInformationForm
        chainEcosystem="ethereum" // TODO: this has to come from step 1 when user selects the community ecosystem
        onSubmit={(values) => console.log('submitted values => ', values)} // TODO: connect api from the onSubmit
        onCancel={() => {}} // TODO: connect when step 1 is done
      />
    </div>
  );
};

export default BasicInformationStep;

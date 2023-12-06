import React from 'react';
import BasicInformationForm from './BasicInformationForm/BasicInformationForm';
import './BasicInformationStep.scss';

const BasicInformationStep = () => {
  return (
    <div className="BasicInformationStep">
      <BasicInformationForm
        chainEcosystem="ethereum" // TODO: this has to come from step 1 when user selects the community ecosystem
        onSubmit={(values) => console.log('submitted values => ', values)} // TODO: connect api from the onSubmit
        onCancel={() => {}} // TODO: connect when step 1 is done
      />
    </div>
  );
};

export default BasicInformationStep;

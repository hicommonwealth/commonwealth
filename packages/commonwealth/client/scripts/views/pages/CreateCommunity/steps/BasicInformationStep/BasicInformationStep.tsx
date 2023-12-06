import React from 'react';
import BasicInformationForm from './BasicInformationForm/BasicInformationForm';
import './BasicInformationStep.scss';

const BasicInformationStep = () => {
  return (
    <div className="BasicInformationStep">
      <BasicInformationForm
        chainEcosystem="ethereum" // TODO: this has to come from step 1 when user selects the community ecosystem
        // TODO: connect api from the onSubmit
        onSubmit={(values) => console.log('submitted values => ', values)}
      />
    </div>
  );
};

export default BasicInformationStep;

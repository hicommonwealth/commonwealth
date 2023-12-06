import React from 'react';
import BasicInformationForm from './BasicInformationForm/BasicInformationForm';
import './BasicInformationStep.scss';

const BasicInformationStep = () => {
  return (
    <div className="BasicInformationStep">
      <BasicInformationForm
        // TODO: connect api from the onSubmit
        onSubmit={(values) => console.log('submitted values => ', values)}
      />
    </div>
  );
};

export default BasicInformationStep;
